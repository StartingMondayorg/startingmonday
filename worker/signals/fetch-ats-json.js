// T3.4 — ATS JSON pollers. Structured job feeds replace HTML scraping where
// available: postings carry stable URLs and open timestamps that feed the
// outcome labeler directly.
//
// SMK-486: the provider set here must stay in lockstep with the scanner's
// adapter set (worker/scanner/ats-adapters.js). A parity test pins the two
// lists together; when one side gains a provider, the other must gain it in
// the same change or the test fails.
//
// Detection happens two ways:
// 1. career_page_url already points at an ATS-hosted board (fast path)
// 2. token probing — candidate board tokens derived from the company name
//    and domain are probed against each provider's public JSON endpoint

import { isLeadershipTitle } from '../lib/outcome-labels.js'

function parseUrl(value) {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

function withTimeout(ms = 12000) {
  return AbortSignal.timeout(ms)
}

async function fetchJson(url, { method = 'GET', body = null } = {}) {
  const response = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: withTimeout(),
  })
  if (!response.ok) throw new Error(`ats_fetch_failed:${response.status}`)
  return response.json()
}

// True when the hostname is the given domain or a subdomain of it.
// Exact suffix matching prevents spoofed hosts like "greenhouse.io.evil.com".
function isHostOrSubdomain(host, domain) {
  return host === domain || host.endsWith(`.${domain}`)
}

// Detects an ATS provider when the career page URL is ATS-hosted. Pure.
export function detectProviderFromUrl(careerPageUrl) {
  const parsed = parseUrl(careerPageUrl)
  if (!parsed) return null

  const host = parsed.hostname.toLowerCase()
  const pathParts = parsed.pathname.split('/').filter(Boolean)

  if (isHostOrSubdomain(host, 'greenhouse.io')) {
    const boardToken = pathParts[pathParts.length - 1]
    return boardToken ? { provider: 'greenhouse', token: boardToken } : null
  }

  if (isHostOrSubdomain(host, 'lever.co')) {
    const account = pathParts[0]
    return account ? { provider: 'lever', token: account } : null
  }

  if (isHostOrSubdomain(host, 'ashbyhq.com')) {
    const org = pathParts[0]
    return org ? { provider: 'ashby', token: org } : null
  }

  if (isHostOrSubdomain(host, 'smartrecruiters.com')) {
    const company = pathParts[0]
    if (!company || company === 'embed') return null
    return { provider: 'smartrecruiters', token: company }
  }

  if (host !== 'bamboohr.com' && isHostOrSubdomain(host, 'bamboohr.com')) {
    const sub = host.slice(0, -'.bamboohr.com'.length)
    if (!sub || sub === 'www') return null
    return { provider: 'bamboohr', token: sub }
  }

  if (host.endsWith('.myworkdayjobs.com')) {
    // Workday boards live at {tenant}.wd{N}.myworkdayjobs.com/{site}; the feed
    // needs both host and site, so the token is composite: "host/site".
    // A leading locale segment (en-US) is skipped when resolving the site.
    const site = pathParts.find((s) => !/^[a-z]{2}-[A-Z]{2}$/.test(s))
    if (!site || !isWorkdayHost(host)) return null
    return { provider: 'workday', token: `${host}/${site}` }
  }

  return null
}

// {tenant}.wd{N}.myworkdayjobs.com and nothing else. The Workday token embeds
// a hostname, so this guard keeps a stored board_token from steering the
// poller at an arbitrary host.
function isWorkdayHost(host) {
  return /^[a-z0-9-]+\.wd\d+\.myworkdayjobs\.com$/.test(host)
}

// Candidate board tokens for probing, derived from company name and domain.
// Pure. Ordered most-likely first; deduplicated.
export function candidateTokens({ name, domain }) {
  const tokens = []
  const domainLabel = (domain ?? '').split('.')[0]?.toLowerCase() ?? ''
  if (domainLabel && domainLabel.length > 1) tokens.push(domainLabel)

  const base = (name ?? '')
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|corp|corporation|company|co|group|holdings|technologies|labs)\b\.?/g, ' ')
    .trim()
  if (base) {
    const squashed = base.replace(/[^a-z0-9]/g, '')
    const hyphenated = base.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    if (squashed.length > 1) tokens.push(squashed)
    if (hyphenated.length > 1 && hyphenated !== squashed) tokens.push(hyphenated)
  }
  return [...new Set(tokens)]
}

async function fetchGreenhouse(boardToken) {
  const payload = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs`)
  return (payload.jobs ?? []).map((job) => ({
    role_title: job.title,
    role_url: job.absolute_url,
    opened_on: job.updated_at ? new Date(job.updated_at).toISOString().slice(0, 10) : null,
    raw: job,
  }))
}

async function fetchLever(account) {
  const payload = await fetchJson(`https://api.lever.co/v0/postings/${encodeURIComponent(account)}?mode=json`)
  return (Array.isArray(payload) ? payload : []).map((job) => ({
    role_title: job.text,
    role_url: job.hostedUrl,
    opened_on: job.createdAt ? new Date(job.createdAt).toISOString().slice(0, 10) : null,
    raw: job,
  }))
}

async function fetchAshby(org) {
  // Official public posting API: https://developers.ashbyhq.com/docs/public-job-posting-api
  const payload = await fetchJson(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(org)}`)
  const postings = payload.jobs ?? []
  return (Array.isArray(postings) ? postings : []).map((job) => ({
    role_title: job.title,
    role_url: job.jobUrl ?? job.applyUrl ?? job.url,
    opened_on: (job.publishedAt ?? job.publishedDate)
      ? new Date(job.publishedAt ?? job.publishedDate).toISOString().slice(0, 10)
      : null,
    raw: job,
  }))
}

async function fetchSmartRecruiters(company) {
  const payload = await fetchJson(`https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(company)}/postings?limit=100`)
  // A live board always carries a content array; anything else is not a board.
  if (!Array.isArray(payload?.content)) throw new Error('ats_bad_shape:smartrecruiters')
  return payload.content.map((job) => ({
    role_title: job.name,
    role_url: job.ref ?? null,
    opened_on: job.releasedDate ? new Date(job.releasedDate).toISOString().slice(0, 10) : null,
    raw: job,
  }))
}

async function fetchBambooHr(sub) {
  if (!/^[a-z0-9.-]+$/i.test(sub)) throw new Error('ats_bad_token:bamboohr')
  const payload = await fetchJson(`https://${sub}.bamboohr.com/careers/list`)
  if (!Array.isArray(payload?.result)) throw new Error('ats_bad_shape:bamboohr')
  return payload.result.map((job) => ({
    role_title: job.jobOpeningName,
    role_url: job.id ? `https://${sub}.bamboohr.com/careers/${job.id}` : null,
    opened_on: null, // the BambooHR list payload carries no posting date
    raw: job,
  }))
}

// token format: "{tenant}.wd{N}.myworkdayjobs.com/{site}"
async function fetchWorkday(token) {
  const [host, site] = String(token ?? '').split('/')
  if (!site || !isWorkdayHost(host)) throw new Error('ats_bad_token:workday')
  const tenant = host.split('.')[0]
  const payload = await fetchJson(`https://${host}/wday/cxs/${tenant}/${encodeURIComponent(site)}/jobs`, {
    method: 'POST',
    body: { appliedFacets: {}, limit: 20, offset: 0, searchText: '' },
  })
  if (!Array.isArray(payload?.jobPostings)) throw new Error('ats_bad_shape:workday')
  return payload.jobPostings.map((job) => ({
    role_title: job.title,
    role_url: job.externalPath ? `https://${host}/${site}${job.externalPath}` : null,
    opened_on: null, // the Workday list payload has no machine-readable date
    raw: job,
  }))
}

const FETCHERS = {
  greenhouse: fetchGreenhouse,
  lever: fetchLever,
  ashby: fetchAshby,
  smartrecruiters: fetchSmartRecruiters,
  bamboohr: fetchBambooHr,
  workday: fetchWorkday,
}

// The provider set the prober searches. Kept in parity with the scanner's
// ADAPTER_PROVIDERS (worker/scanner/ats-adapters.js) by a test.
export const PROBE_PROVIDERS = Object.keys(FETCHERS)
const PROVIDERS = PROBE_PROVIDERS

// True when a recorded decided-against provider set is missing providers the
// prober now searches. Null/unknown means the row predates recording (the
// original three-provider prober) and is treated as outdated. SMK-486.
export function providerSetMissing(recordedProviders, currentProviders = PROBE_PROVIDERS) {
  const recorded = Array.isArray(recordedProviders) ? recordedProviders : []
  return currentProviders.some((provider) => !recorded.includes(provider))
}

// Workday cannot be probed with a bare token: the host embeds an unknowable
// cluster number and the feed needs a site name. Bounded guessing: common
// clusters, then common site names. A missing tenant fails DNS fast; a wrong
// site 404s. Returns the composite token or throws.
const WORKDAY_CLUSTERS = [1, 2, 3, 5]
async function probeWorkdayToken(token) {
  if (!/^[a-z0-9-]+$/.test(token)) throw new Error('ats_bad_token:workday')
  for (const cluster of WORKDAY_CLUSTERS) {
    const host = `${token}.wd${cluster}.myworkdayjobs.com`
    for (const site of [token, 'External', 'careers']) {
      const composite = `${host}/${site}`
      try {
        await fetchWorkday(composite)
        return composite
      } catch {
        // wrong cluster or site; keep going
      }
    }
  }
  throw new Error('ats_probe_miss:workday')
}

// Per-provider probe: returns the board token to store on success, throws on
// a miss. For most providers the probe token is the board token; Workday
// resolves a composite host/site token.
const PROBERS = {
  greenhouse: async (token) => { await fetchGreenhouse(token); return token },
  lever: async (token) => { await fetchLever(token); return token },
  ashby: async (token) => { await fetchAshby(token); return token },
  smartrecruiters: async (token) => { await fetchSmartRecruiters(token); return token },
  bamboohr: async (token) => { await fetchBambooHr(token); return token },
  workday: probeWorkdayToken,
}

// Fetches all postings for a known board; returns leadership postings only.
// Never throws — an unreachable board yields an empty list.
export async function fetchBoardOpenings(provider, token) {
  const fetcher = FETCHERS[provider]
  if (!fetcher || !token) return []
  try {
    const openings = await fetcher(token)
    return openings
      .filter((opening) => opening.role_title && opening.role_url)
      .filter((opening) => isLeadershipTitle(opening.role_title))
  } catch {
    return []
  }
}

// Probes for an ATS board: URL detection first, then token probing across
// providers. Returns { provider, token, via } or null. Never throws.
export async function probeAtsBoard({ name, domain, careerPageUrl }) {
  const fromUrl = detectProviderFromUrl(careerPageUrl)
  if (fromUrl) return { ...fromUrl, via: 'career_page_url' }

  for (const token of candidateTokens({ name, domain })) {
    for (const provider of PROVIDERS) {
      try {
        // A live board resolves to a stored token. Misses throw.
        const boardToken = await PROBERS[provider](token)
        return { provider, token: boardToken, via: 'probe' }
      } catch {
        // 404 / non-JSON / bad shape → not this provider+token; keep probing
      }
    }
  }
  return null
}

// Back-compat: single-call fetch for an ATS-hosted career page URL.
export async function fetchAtsOpenings(careerPageUrl) {
  const source = detectProviderFromUrl(careerPageUrl)
  if (!source) return { provider: null, openings: [] }
  const openings = await fetchBoardOpenings(source.provider, source.token)
  return { provider: source.provider, openings }
}
