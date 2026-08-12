// Pure, testable core for signal classification: prompt construction, response
// parsing, and normalization. No SDK or network dependencies.

export const CLASSIFY_MAX_TOKENS = 768

const VALID_ENTITY_MATCH = ['high', 'medium', 'low']

// Builds the compact company-context block for entity disambiguation.
// Accepts a company row (or null) and tolerates missing fields.
export function classifyCompanyContext(company) {
  if (!company || typeof company !== 'object') return null
  const context = {
    sector: company.sector ?? null,
    isPublic: typeof company.is_public_company === 'boolean' ? company.is_public_company : null,
  }
  if (context.sector === null && context.isPublic === null) return null
  return context
}

function companyContextLines(companyContext) {
  if (!companyContext) return ''
  const lines = []
  if (companyContext.sector) lines.push(`- Sector: ${companyContext.sector}`)
  if (typeof companyContext.isPublic === 'boolean') {
    lines.push(`- Listing: ${companyContext.isPublic ? 'publicly traded' : 'private company'}`)
  }
  if (!lines.length) return ''
  return `\n\nCompany context (use this to confirm the article is about the right company):\n${lines.join('\n')}`
}

export function buildClassifyPrompt(companyName, article, roleType = null, companyContext = null, signalPriority = '') {
  return `You are analyzing a news article about "${companyName}" to determine if it is a meaningful signal for an executive job seeker targeting this company.

Article title: ${article.title}
Description: ${article.description || '(none)'}
Published: ${article.pubDate || 'unknown'}${companyContextLines(companyContext)}${signalPriority ? `\n\nCandidate context: ${signalPriority}` : ''}

Output JSON only, no markdown fences:
{
  "is_signal": true or false,
  "entity_match": "high" | "medium" | "low" — how confident you are the article is about this specific company (not a different company with a similar name),
  "signal_type": one of: funding, exec_departure, exec_hire, acquisition, expansion, layoffs, ipo, new_product, award, breach_disclosure, regulatory_change, data_platform, ai_investment, board_change, transformation_budget, partnership, or null if not a signal,
  "confidence": integer 0-100,
  "signal_summary": "one factual sentence describing what happened - specific, no filler",
  "outreach_angle": "one sentence on how this news creates an opening for an executive candidate - concrete and specific to this signal type",
  "focus_tags": ["up to 3 short tags from this set: growth, governance, leadership, restructuring, product, security, data, ai, compliance, partnership, operations"],
  "evidence_snippets": ["up to 2 short factual snippets copied/paraphrased from title/description"],
  "partner_entities": ["up to 3 partner/company names if this is a partnership signal, else []"]
}

Strong signals (set is_signal=true): funding rounds, executive departures or new hires, acquisitions, market expansion, layoffs (which often precede leadership restructuring), IPO filings, major product launches, security breaches or data incidents (breach_disclosure), new compliance or regulatory requirements affecting the company's sector (regulatory_change), data infrastructure investments such as Snowflake, Databricks, or data lakehouse announcements (data_platform), AI initiative announcements or AI leadership hires (ai_investment), board member additions or departures especially those with technology or transformation backgrounds (board_change), major technology or digital transformation budget commitments and multi-year program launches (transformation_budget), and material partnerships (partnership) such as ERP platform deals, major supply agreements, strategic channel partnerships, and multi-year implementation contracts.
Weak or no signal: general earnings coverage, minor partnerships, routine product updates, industry commentary not specific to this company.
Set entity_match to "low" when the article could plausibly be about a different company with a similar name, and reflect that uncertainty in confidence. Confidence below 60 means you are uncertain this is genuinely newsworthy for this company.`
}

// Parses a raw model response into JSON. Throws on malformed output so the
// caller can retry — silent failure is not allowed.
export function parseClassifyResponse(raw) {
  const cleaned = (raw ?? '')
    .trim()
    .replace(/^```json\n?/, '')
    .replace(/^```\n?/, '')
    .replace(/\n?```$/, '')
    .trim()
  if (!cleaned) throw new Error('empty classification response')

  try {
    return JSON.parse(cleaned)
  } catch (initialError) {
    const start = cleaned.indexOf('{')
    if (start < 0) throw initialError

    let depth = 0
    let inString = false
    let escaped = false
    for (let index = start; index < cleaned.length; index += 1) {
      const character = cleaned[index]
      if (inString) {
        if (escaped) escaped = false
        else if (character === '\\') escaped = true
        else if (character === '"') inString = false
        continue
      }

      if (character === '"') inString = true
      else if (character === '{') depth += 1
      else if (character === '}') {
        depth -= 1
        if (depth === 0) return JSON.parse(cleaned.slice(start, index + 1))
      }
    }

    throw initialError
  }
}

// Normalizes a parsed classification: caps arrays, validates entity_match.
export function normalizeClassification(parsed) {
  const entityMatch = VALID_ENTITY_MATCH.includes(parsed?.entity_match) ? parsed.entity_match : null
  return {
    ...parsed,
    entity_match: entityMatch,
    focus_tags: Array.isArray(parsed?.focus_tags) ? parsed.focus_tags.slice(0, 3) : [],
    evidence_snippets: Array.isArray(parsed?.evidence_snippets) ? parsed.evidence_snippets.slice(0, 2) : [],
    partner_entities: Array.isArray(parsed?.partner_entities) ? parsed.partner_entities.slice(0, 3) : [],
  }
}
