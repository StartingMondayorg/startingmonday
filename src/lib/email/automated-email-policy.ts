function normalizeEmail(value: string | null | undefined): string {
  return String(value ?? '').trim().toLowerCase()
}

const BRIEFING_ONLY_RECIPIENTS = new Set(
  String(process.env.BRIEFING_ONLY_RECIPIENTS ?? 'richard@startingmonday.app')
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean),
)

export function shouldSuppressAutomatedEmail({
  to,
  category = 'general',
}: {
  to: string | string[]
  category?: string
}) {
  const recipients = Array.isArray(to) ? to.map(normalizeEmail) : [normalizeEmail(to)]
  const hit = recipients.find((email) => BRIEFING_ONLY_RECIPIENTS.has(email))
  if (!hit) return { suppress: false, reason: null }
  if (category === 'briefing') return { suppress: false, reason: null }
  return {
    suppress: true,
    reason: `recipient ${hit} is configured for briefing-only delivery`,
  }
}