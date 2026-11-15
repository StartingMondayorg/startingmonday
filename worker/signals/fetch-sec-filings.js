import { logger } from '../lib/logger.js'

const EDGAR_SEARCH  = 'https://efts.sec.gov/LATEST/search-index'
const EDGAR_SUBS    = 'https://data.sec.gov/submissions'
const EDGAR_ARCHIVE = 'https://www.sec.gov/Archives/edgar/data'
const UA = 'StartingMonday/1.0 contact@startingmonday.app'

// SEC requires a descriptive User-Agent with contact info.
const HEADERS = { 'User-Agent': UA }

// Item codes that indicate signals relevant to executive job seekers.
const SIGNAL_ITEMS = new Set(['5.02', '1.01', '2.01', '1.03', '8.01'])

const ITEM_LABELS = {
  '5.02': 'Executive Leadership Change (departure or appointment of officers)',
  '1.01': 'Entry into a Material Definitive Agreement',
  '2.01': 'Completion of Acquisition or Disposition of Assets',
  '1.03': 'Bankruptcy or Receivership Filing',
  '8.01': 'Other Material Events Disclosure',
}

const GUIDANCE_PATTERNS = [
  /guidance/gi,
  /outlook/gi,
  /expects?\s+to/gi,
  /fiscal\s+\d{4}/gi,
  /capital\s+expenditures?/gi,
]

// Returns up to 8 filing-derived articles: 8-K material events plus 10-Q/10-K context where available.
// Shape: { title, description, link, pubDate, filingForm, filingItems, filingFocus }
// When { supabase, companyId } provided, also indexes all 8-K filings (12 months) into sec_filings.
export async function fetchSecFilings(companyName, { supabase, companyId } = {}) {
  const emptyStats = {
    filingsConsidered: 0,
    filingsIndexed: 0,
    latestFilingDate: null,
    latestIngestedAt: null,
  }

  try {
    const cikPadded = await findCik(companyName, { supabase, companyId })
    if (!cikPadded) {
      return {
        articles: [],
        indexStats: emptyStats,
        fetchError: null,
      }
    }

    const result = await getRecentFilings(companyName, cikPadded, { supabase, companyId })
    return {
      articles: result.articles,
      indexStats: result.indexStats,
      fetchError: null,
    }
  } catch (err) {
    logger.warn('fetch-sec-filings: failed', { company: companyName, error: err.message })
    return {
      articles: [],
      indexStats: emptyStats,
      fetchError: err instanceof Error ? err.message : 'fetch failed',
    }
  }
}

// SMK-509: a full-text hit only proves a filing MENTIONS the name. The filer is the
// entity in _source.display_names / _source.ciks, and we accept it only when its
// name equals the company name after normalization. Never use the _id prefix: that
// is the accession number's submitter, often a filing agent (Donnelley, Toppan
// Merrill), not the company. entity_name is not in the EFTS response at all; the
// old check read it as '' and accepted the first hit for every company.
const CORPORATE_SUFFIXES = new Set([
  'inc', 'incorporated', 'corp', 'corporation', 'co', 'company', 'ltd', 'limited',
  'llc', 'lp', 'plc', 'sa', 'ag', 'nv', 'se',
])

export function normalizeEntityName(name) {
  const words = String(name ?? '')
    .toLowerCase()
    .replace(/\/[a-z]{2,3}\/?/g, ' ') // SEC state and agent tags: /DE/, /FA
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  if (words[0] === 'the') words.shift()
  // "ELI LILLY & Co" -> "eli lilly and co" -> "eli lilly"
  while (words.length > 1 && (CORPORATE_SUFFIXES.has(words[words.length - 1]) || words[words.length - 1] === 'and')) words.pop()
  return words.join(' ')
}

// display_names entries look like "ADVANCED MICRO DEVICES INC  (AMD)  (CIK 0000002488)".
function parseDisplayName(displayName) {
  const cik = /\(CIK\s+(\d{1,10})\)/.exec(displayName)?.[1] ?? null
  const name = displayName.replace(/\s*\([^)]*\)/g, '').trim()
  return { name, cik: cik ? cik.padStart(10, '0') : null }
}

export function pickCikFromHits(companyName, hits) {
  const target = normalizeEntityName(companyName)
  if (!target) return null
  for (const hit of hits ?? []) {
    const src = hit?._source ?? {}
    const names = Array.isArray(src.display_names) ? src.display_names : []
    const ciks = Array.isArray(src.ciks) ? src.ciks : []
    for (let i = 0; i < names.length; i++) {
      const parsed = parseDisplayName(String(names[i]))
      const cik = parsed.cik ?? (ciks[i] ? String(ciks[i]).padStart(10, '0') : null)
      if (cik && normalizeEntityName(parsed.name) === target) return cik
    }
  }
  return null
}

// Step 1: find the CIK — reads from DB cache first, falls back to EDGAR full-text search.
// Persists the resolved (or confirmed-absent) CIK back to the companies row so subsequent
// scans skip the network round-trip.
async function findCik(companyName, { supabase, companyId } = {}) {
  // DB cache: check if we've already resolved this company's CIK.
  if (supabase && companyId) {
    const { data } = await supabase
      .from('companies')
      .select('sec_cik_padded, is_public_company')
      .eq('id', companyId)
      .maybeSingle()

    if (data?.sec_cik_padded) return data.sec_cik_padded
    // Explicitly marked non-public on a prior run — don't re-query EDGAR.
    if (data?.is_public_company === false) return null
  }

  // EDGAR full-text search — find a recent 8-K filed by this company name.
  const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const url = `${EDGAR_SEARCH}?q=${encodeURIComponent(`"${companyName}"`)}&forms=8-K&dateRange=custom&startdt=${since}`

  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) })
  if (!res.ok) return null

  const json = await res.json()
  const cikPadded = pickCikFromHits(companyName, json.hits?.hits ?? [])

  // Persist result so future scans skip this lookup.
  if (supabase && companyId) {
    const update = cikPadded
      ? {
          sec_cik:             cikPadded.replace(/^0+/, ''),
          sec_cik_padded:      cikPadded,
          sec_cik_resolved_at: new Date().toISOString(),
          is_public_company:   true,
        }
      : {
          sec_cik_resolved_at: new Date().toISOString(),
          is_public_company:   false,
        }
    await supabase.from('companies').update(update).eq('id', companyId)
  }

  return cikPadded
}

// Step 2: fetch the submissions JSON for this CIK to get recent 8-K filings with item types.
async function getRecentFilings(companyName, cikPadded, { supabase, companyId } = {}) {
  const cik = cikPadded.replace(/^0+/, '')
  const url = `${EDGAR_SUBS}/CIK${cikPadded}.json`

  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) })
  if (!res.ok) return []

  const data = await res.json()
  const f = data.filings?.recent
  if (!f) return []

  // Index all 8-K filings from the past 12 months for trend detection
  let indexStats = {
    filingsConsidered: 0,
    filingsIndexed: 0,
    latestFilingDate: null,
    latestIngestedAt: null,
  }

  if (supabase && companyId) {
    indexStats = await indexAllFilings(supabase, companyId, cik, f)
  }

  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const contextCutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const articles = []

  // Pull one recent 10-Q and one recent 10-K for strategic context and guidance language.
  const contextForms = ['10-Q', '10-K']
  for (const form of contextForms) {
    const idx = (f.form ?? []).findIndex((x, i) => x === form && (f.filingDate?.[i] ?? '') >= contextCutoff)
    if (idx === -1) continue

    const filingDate = f.filingDate?.[idx]
    const accession = f.accessionNumber?.[idx] ?? ''
    const primaryDoc = f.primaryDocument?.[idx] ?? ''
    if (!filingDate || !accession) continue

    const accFormatted = accession.replace(/-/g, '')
    const link = primaryDoc
      ? `${EDGAR_ARCHIVE}/${cik}/${accFormatted}/${primaryDoc}`
      : `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=${form}`

    const snippet = primaryDoc ? await fetchDocSnippet(link) : ''
    const guidanceHints = extractGuidanceHints(snippet)
    const description = guidanceHints.length
      ? `${form} filed ${filingDate} by ${companyName}. Potential strategic focus and guidance language: ${guidanceHints.join(' | ')}`
      : `${form} filed ${filingDate} by ${companyName}. Use this filing for strategic context, risk factors, and management priorities.`

    articles.push({
      title: `SEC ${form}: Strategic context at ${companyName}`,
      description,
      link,
      pubDate: filingDate,
      filingForm: form,
      filingItems: [],
      filingFocus: guidanceHints,
    })
  }

  for (let i = 0; i < (f.form ?? []).length; i++) {
    if (f.form[i] !== '8-K') continue
    const filingDate = f.filingDate?.[i]
    if (!filingDate || filingDate < cutoff) continue

    const items = f.items?.[i] ?? ''
    const itemList = items.split(',').map(s => s.trim()).filter(s => SIGNAL_ITEMS.has(s))
    if (itemList.length === 0) continue

    const accession   = f.accessionNumber?.[i] ?? ''
    const primaryDoc  = f.primaryDocument?.[i] ?? ''
    if (!accession) continue

    const accFormatted = accession.replace(/-/g, '')
    const itemDescriptions = itemList.map(item => ITEM_LABELS[item]).filter(Boolean)
    const itemLabel = itemDescriptions[0] ?? 'Material Event'

    // Try to fetch a snippet of the primary document for richer classification context.
    let docSnippet = ''
    if (primaryDoc) {
      const docUrl = `${EDGAR_ARCHIVE}/${cik}/${accFormatted}/${primaryDoc}`
      docSnippet = await fetchDocSnippet(docUrl)
    }

    const baseDescription = `SEC Form 8-K filed ${filingDate} by ${companyName}. Disclosed item: ${itemDescriptions.join('; ')}.`
    const description = docSnippet
      ? `${baseDescription} Filing excerpt: ${docSnippet}`
      : baseDescription

    const link = primaryDoc
      ? `${EDGAR_ARCHIVE}/${cik}/${accFormatted}/${primaryDoc}`
      : `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=8-K`

    articles.push({
      title: `SEC 8-K: ${itemLabel} at ${companyName}`,
      description,
      link,
      pubDate: filingDate,
      filingForm: '8-K',
      filingItems: itemList,
      filingFocus: extractGuidanceHints(docSnippet),
    })

    if (articles.length >= 8) break
  }

  return {
    articles,
    indexStats,
  }
}

function extractGuidanceHints(text) {
  if (!text) return []

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean)

  const hits = []
  for (const sentence of sentences) {
    if (GUIDANCE_PATTERNS.some(re => re.test(sentence))) {
      hits.push(sentence.slice(0, 220))
    }
    if (hits.length >= 2) break
  }
  return hits
}

// Upsert all 8-K filings from the past 12 months into sec_filings for trend analysis.
async function indexAllFilings(supabase, companyId, cik, f) {
  const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const toUpsert = []
  let latestFilingDate = null

  for (let i = 0; i < (f.form ?? []).length; i++) {
    if (f.form[i] !== '8-K') continue
    const filingDate = f.filingDate?.[i]
    if (!filingDate || filingDate < yearAgo) continue
    const accession = f.accessionNumber?.[i]
    if (!accession) continue
    const items = (f.items?.[i] ?? '').split(',').map(s => s.trim()).filter(Boolean)
    toUpsert.push({ company_id: companyId, cik, accession_number: accession, filing_date: filingDate, items })
    if (!latestFilingDate || filingDate > latestFilingDate) latestFilingDate = filingDate
  }

  if (toUpsert.length) {
    await supabase
      .from('sec_filings')
      .upsert(toUpsert, { onConflict: 'company_id,accession_number' })
  }

  return {
    filingsConsidered: toUpsert.length,
    filingsIndexed: toUpsert.length,
    latestFilingDate,
    latestIngestedAt: toUpsert.length ? new Date().toISOString() : null,
  }
}

// Fetch first 1500 chars of a filing document and strip HTML tags.
async function fetchDocSnippet(url) {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(5000) })
    if (!res.ok) return ''
    const html = await res.text()
    const text = html
      .replace(/<style\b[\s\S]*?<\/style\b[^>]*>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1500)
    return text
  } catch {
    return ''
  }
}
