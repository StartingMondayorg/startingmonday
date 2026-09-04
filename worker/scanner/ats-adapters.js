// ATS adapters: pull structured job listings straight from an applicant-tracking
// system's public JSON API instead of scraping a JS-rendered career page.
//
// Why: modern ATS career boards (Greenhouse, Lever, Ashby, SmartRecruiters,
// BambooHR, Workday, ...) render their job lists client-side, often inside iframes or via
// delayed XHR. A headless render (browserless.io) returns the shell but rarely the job
// text, so the scanner detects zero roles. Each of these ATS, however, exposes a
// documented, unauthenticated JSON endpoint that returns clean listings — far more
// reliable and cheaper than rendering.
//
// Usage:
//   const feed = await fetchAtsJobs(careerPageUrl)
//   if (feed?.jobs.length) { /* use feed.jobs — [{ title, location, url }] */ }
//   else { /* fall back to fetchPage()/browserless.io */ }

import { logger } from '../lib/logger.js'

const UA = 'Mozilla/5.0 (compatible; StartingMondayScanner/1.0; +https://startingmonday.app)'
const FETCH_TIMEOUT_MS = 12000

function hostOf(url) {
  try { return new URL(url).hostname.toLowerCase() } catch { return '' }
}
function pathSegments(url) {
  try { return new URL(url).pathname.split('/').filter(Boolean) } catch { return [] }
}
function subdomain(url, base) {
  const h = hostOf(url)
  return h.endsWith(`.${base}`) ? h.slice(0, -(`.${base}`).length) : null
}
function locationString(...parts) {
  return parts.filter(Boolean).join(', ') || null
}

// Each adapter's `resolve(url)` returns a request descriptor `{ url, method?, body? }`
// (or null when the URL is not this ATS), and `parse(json)` normalizes the response to
// [{ title, location, url }]. Detection is "first adapter that resolves".
const ADAPTERS = [
  {
    name: 'greenhouse',
    resolve(url) {
      const h = hostOf(url)
      if (!h.includes('greenhouse.io')) return null
      let token = null
      try { token = new URL(url).searchParams.get('for') } catch { /* ignore */ }
      token = token || pathSegments(url)[0] || subdomain(url, 'greenhouse.io')
      if (!token || token === 'embed') return null
      return { url: `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs` }
    },
    parse(data) {
      return (data?.jobs ?? []).map((j) => ({
        title: j.title,
        location: j.location?.name ?? null,
        url: j.absolute_url ?? null,
      }))
    },
  },
  {
    name: 'lever',
    resolve(url) {
      const h = hostOf(url)
      let company = null
      if (h === 'jobs.lever.co' || h.endsWith('.lever.co')) {
        company = h === 'jobs.lever.co' ? pathSegments(url)[0] : subdomain(url, 'lever.co')
      }
      if (!company) return null
      return { url: `https://api.lever.co/v0/postings/${encodeURIComponent(company)}?mode=json` }
    },
    parse(data) {
      return (Array.isArray(data) ? data : []).map((j) => ({
        title: j.text,
        location: j.categories?.location ?? null,
        url: j.hostedUrl ?? j.applyUrl ?? null,
      }))
    },
  },
  {
    name: 'ashby',
    resolve(url) {
      const h = hostOf(url)
      if (h !== 'ashbyhq.com' && !h.endsWith('.ashbyhq.com')) return null
      const org = pathSegments(url)[0]
      if (!org) return null
      // Official public posting API: https://developers.ashbyhq.com/docs/public-job-posting-api
      return { url: `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(org)}` }
    },
    parse(data) {
      return (data?.jobs ?? []).map((j) => ({
        title: j.title,
        location: j.location ?? null,
        url: j.jobUrl ?? j.applyUrl ?? null,
      }))
    },
  },
  {
    name: 'smartrecruiters',
    resolve(url) {
      const h = hostOf(url)
      if (!h.endsWith('smartrecruiters.com')) return null
      const company = pathSegments(url)[0]
      if (!company) return null
      return { url: `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(company)}/postings?limit=100` }
    },
    parse(data) {
      return (data?.content ?? []).map((j) => ({
        title: j.name,
        location: locationString(j.location?.city, j.location?.region, j.location?.country),
        url: j.ref ?? null,
      }))
    },
  },
  {
    name: 'bamboohr',
    resolve(url) {
      const sub = subdomain(url, 'bamboohr.com')
      if (!sub) return null
      return { url: `https://${sub}.bamboohr.com/careers/list` }
    },
    parse(data) {
      return (data?.result ?? []).map((j) => ({
        title: j.jobOpeningName,
        location: locationString(j.location?.city, j.location?.state, j.location?.country),
        url: null, // BambooHR list has no absolute url; id only
      }))
    },
  },
  {
    // Workday: host is {tenant}.wd{N}.myworkdayjobs.com/{site}. The public jobs feed is
    // a POST to the CXS endpoint reconstructed from tenant + site.
    name: 'workday',
    resolve(url) {
      const h = hostOf(url)
      if (!h.endsWith('.myworkdayjobs.com')) return null
      const labels = h.split('.') // [tenant, wdN, myworkdayjobs, com]
      const tenant = labels[0]
      if (!tenant || labels.length < 4) return null
      // site = first path segment that is not a locale like "en-US"
      const site = pathSegments(url).find((s) => !/^[a-z]{2}-[A-Z]{2}$/.test(s))
      if (!site) return null
      return {
        url: `https://${h}/wday/cxs/${tenant}/${encodeURIComponent(site)}/jobs`,
        method: 'POST',
        body: { appliedFacets: {}, limit: 20, offset: 0, searchText: '' },
      }
    },
    parse(data) {
      return (data?.jobPostings ?? []).map((j) => ({
        title: j.title,
        location: j.locationsText ?? null,
        url: j.externalPath ?? null,
      }))
    },
  },
]

// The provider set the scanner recognizes. Kept in parity with the ATS
// prober's PROBE_PROVIDERS (worker/signals/fetch-ats-json.js) by a test:
// a provider added on one side must be added on the other. SMK-486.
export const ADAPTER_PROVIDERS = ADAPTERS.map((adapter) => adapter.name)

// Detect which ATS (if any) a career-page URL belongs to.
export function detectAts(url) {
  for (const adapter of ADAPTERS) {
    const request = adapter.resolve(url)
    if (request) return { name: adapter.name, endpoint: request.url, request, adapter }
  }
  return null
}

// Fetch + normalize an ATS job feed. Returns { ats, endpoint, jobs } on success, or
// null when the URL is not a recognized ATS or the API call fails (caller falls back
// to HTML/browserless.io). Never throws.
export async function fetchAtsJobs(url) {
  const hit = detectAts(url)
  if (!hit) return null
  const { request } = hit
  try {
    const res = await fetch(request.url, {
      method: request.method ?? 'GET',
      headers: {
        'User-Agent': UA,
        Accept: 'application/json',
        ...(request.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: request.body ? JSON.stringify(request.body) : undefined,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!res.ok) {
      logger.warn('ats-adapters: API non-OK, falling back', { url, ats: hit.name, status: res.status })
      return null
    }
    const data = await res.json()
    const jobs = hit.adapter.parse(data).filter((j) => j.title && String(j.title).trim())
    logger.info('ats-adapters: fetched job feed', { url, ats: hit.name, jobCount: jobs.length })
    return { ats: hit.name, endpoint: hit.endpoint, jobs }
  } catch (err) {
    logger.warn('ats-adapters: fetch failed, falling back', { url, ats: hit.name, error: err.message })
    return null
  }
}

// Render a job feed as newline-delimited text so the existing detectRoles() /
// scoreHit() pipeline can consume it unchanged.
export function jobsToText(jobs) {
  return (jobs ?? [])
    .map((j) => (j.location ? `${j.title} — ${j.location}` : String(j.title)))
    .join('\n')
}
