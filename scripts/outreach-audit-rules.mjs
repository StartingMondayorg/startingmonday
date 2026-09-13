const DEFAULT_LOOKBACK_DAYS = 7

export function resolveLookbackDays(raw = process.env.OUTREACH_DB_AUDIT_LOOKBACK_DAYS) {
  const value = String(raw ?? '').trim()
  if (!value) return DEFAULT_LOOKBACK_DAYS
  if (!/^[1-9]\d*$/.test(value)) return DEFAULT_LOOKBACK_DAYS
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_LOOKBACK_DAYS
}

export function checkSignature(text) {
  const norm = (text ?? '').replace(/\r\n/g, '\n').trim()
  if (!norm) return false
  return /\nRich\nstartingmonday\.app(\n|$)/.test(norm)
}

export function checkForbidden(text) {
  const norm = (text ?? '').toLowerCase()
  return /remit|i hope this finds you well|guaranteed|risk free|act now|limited time|buy now|double your|no obligation|click here|winner|urgent response needed|em dash|—/.test(norm)
}

export function computeLookbackWindow(nowMs, lookbackDays) {
  return {
    endIso: new Date(nowMs).toISOString(),
    startIso: new Date(nowMs - lookbackDays * 24 * 60 * 60 * 1000).toISOString(),
  }
}

export function buildKeysetCursorDisjunction(lastSentAt, lastId) {
  if (lastSentAt == null || lastSentAt === '' || lastId == null || lastId === '') return null
  return `and(sent_at.eq.${lastSentAt},id.gt.${lastId}),sent_at.gt.${lastSentAt}`
}
