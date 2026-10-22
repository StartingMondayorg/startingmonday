const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.co.in',
  'hotmail.com', 'outlook.com', 'live.com', 'msn.com', 'icloud.com',
  'me.com', 'mac.com', 'protonmail.com', 'proton.me', 'pm.me',
  'hey.com', 'fastmail.com', 'fastmail.fm', 'aol.com', 'zoho.com',
])

// A login address on an employer domain is a delivery risk for briefings
// (assistants, filters, departure). Used to decide whether to suggest a
// personal delivery address on the profile page.
export function isCorporateEmail(email: string | null | undefined): boolean {
  const domain = (email ?? '').split('@')[1]?.trim().toLowerCase() ?? ''
  return !!domain && !PERSONAL_DOMAINS.has(domain)
}
