import { PostHog } from 'posthog-node'

let _client: PostHog | null = null

function getClient(): PostHog | null {
  if (process.env.NODE_ENV !== 'production') return null
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return null
  if (!_client) {
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com'
    _client = new PostHog(key, {
      host,
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return _client
}

export function captureServerEvent(
  userId: string,
  event: string,
  properties: Record<string, string | number | boolean | null> = {}
): void {
  try {
    const ph = getClient()
    ph?.capture({ distinctId: userId, event, properties })
  } catch {
    // never throw - analytics must not interrupt product flows
  }
}
