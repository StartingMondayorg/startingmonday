export function getOwnerEmail(): string | undefined {
  return process.env.OWNER_EMAIL ?? process.env.NOTIFY_EMAIL
}

// Returns the full list of admin notification recipients.
// Reads NOTIFY_EMAILS (comma-separated) first, then falls back to OWNER_EMAIL / NOTIFY_EMAIL.
export function getNotifyEmails(): string[] {
  const raw = process.env.NOTIFY_EMAILS ?? process.env.OWNER_EMAIL ?? process.env.NOTIFY_EMAIL ?? ''
  return raw.split(',').map(e => e.trim()).filter(Boolean)
}
