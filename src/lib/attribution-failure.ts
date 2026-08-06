import * as Sentry from '@sentry/nextjs'

type AttributionContext = {
  path: 'password_signup' | 'auth_callback'
  signup_source?: string | null
  manager_tools?: boolean
}

type WriteError = { message?: string; code?: string; details?: string } | null | undefined

/**
 * Report a failed signup attribution/consent write.
 *
 * The signup and OAuth callback flows write attribution (signup_source,
 * acquisition_channel, referral_source), the campaign trial length, and the
 * policy-acceptance record in a single UPDATE. Both call sites used to drop the
 * result on the floor, so when migration 165 was missing from production the
 * statement was rejected for seven weeks with no signal anywhere (SMK-456):
 * every campaign looked like it had zero signups and no consent was recorded.
 *
 * Attribution must never block account creation, so this only reports.
 */
export function reportAttributionFailure(error: WriteError, context: AttributionContext): void {
  if (!error) return

  const message = error.message ?? 'unknown error'

  try {
    console.error('[attribution] signup write failed', { ...context, error: message, code: error.code })
  } catch { /* logging must not throw */ }

  try {
    Sentry.captureException(new Error(`Signup attribution write failed: ${message}`), {
      level: 'error',
      tags: { area: 'signup_attribution', signup_path: context.path },
      extra: { ...context, supabase_code: error.code, supabase_details: error.details },
    })
  } catch { /* reporting must not throw */ }
}
