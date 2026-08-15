import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import type { EmailOtpType } from '@supabase/supabase-js'
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/policy-versions'
import { logEvent } from '@/lib/events'
import { reportAttributionFailure } from '@/lib/attribution-failure'
import { resolveOnboardingDestination } from '@/lib/onboarding-state'

function getSafeNextPath(nextParam: string | null): string {
  if (!nextParam) return '/dashboard/briefing'
  if (!nextParam.startsWith('/')) return '/dashboard/briefing'
  if (nextParam.startsWith('//')) return '/dashboard/briefing'
  return nextParam
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// The path lands in a <script> body. JSON.stringify handles the JS string
// context; escaping "<" additionally stops a "</script>" in the next param
// from closing the tag early and injecting markup.
function escapeScriptString(value: string): string {
  return JSON.stringify(value).replace(/</g, '\\u003C')
}

// proxy.ts sets a per-request nonce CSP with no 'unsafe-inline', so this
// script must carry the nonce or the browser drops it and the user is
// stranded on a blank /auth/callback page. The meta refresh and the link are
// script-free fallbacks: CSP cannot block them, so a missing or mismatched
// nonce degrades to a slower redirect instead of a dead end.
function createClientRedirectResponse(path: string, nonce: string | null): NextResponse {
  const nonceAttribute = nonce ? ` nonce="${escapeHtmlAttribute(nonce)}"` : ''
  const hrefPath = escapeHtmlAttribute(path)
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8">`
    + `<meta http-equiv="refresh" content="0;url=${hrefPath}">`
    + `<script${nonceAttribute}>location.replace(${escapeScriptString(path)})</script>`
    + `</head><body><a href="${hrefPath}">Continue</a></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const tokenType = searchParams.get('type')
  const rawNextParam = searchParams.get('next')
  const nextPath = getSafeNextPath(rawNextParam)
  const hasExplicitNext = !!rawNextParam

  // Railway proxies requests: request.url uses the internal localhost:8080 address.
  // x-forwarded-host contains the real public hostname (startingmonday.app).
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const publicOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : origin

  // proxy.ts stamps the CSP nonce onto the forwarded request headers.
  const nonce = request.headers.get('x-nonce')

  if (code || (tokenHash && tokenType)) {
    const cookieStore = await cookies()

    // Resolve redirect after session exchange so first-login users with no
    // explicit next path can be sent directly to onboarding in one hop.
    let resolvedNextPath = nextPath
    let response = createClientRedirectResponse(resolvedNextPath, nonce)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Write to both the Next.js cookie store and directly onto the
              // redirect response; whichever Railway/Next.js uses wins.
              try { cookieStore.set(name, value, options) } catch {}
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const authResult = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({
          token_hash: tokenHash!,
          type: tokenType as EmailOtpType,
        })

    const { data, error } = authResult

    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      event: 'auth_callback',
      ok: !error && !!data.session,
      userId: data.user?.id ?? null,
      error: error?.message ?? null,
    }))

    if (!error && data.session && data.user) {
      const user = data.user
      const userId = user.id
      const userEmail = user.email
      const utmSource = searchParams.get('utm_source')
      const refCode = searchParams.get('ref_code')?.trim() || null
      const selfReportedSource = searchParams.get('self_reported_source')
      const referrerName = searchParams.get('referrer_name')?.trim().slice(0, 120) || null
      const referrerCompany = searchParams.get('referrer_company')?.trim().slice(0, 160) || null
      const utmMedium = searchParams.get('utm_medium')
      const acceptedTermsVersion = searchParams.get('accepted_terms_version')
      const acceptedPrivacyVersion = searchParams.get('accepted_privacy_version')
      const policyAcceptedAt = searchParams.get('policy_accepted_at')
      const source = utmSource ?? selfReportedSource ?? refCode
      const managerToolsSource = (source ?? '').trim().toLowerCase() === 'managertools'
      const managerToolsTrialEndsAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
      const consentAcceptedAt = (() => {
        if (!policyAcceptedAt) return new Date().toISOString()
        const parsed = Date.parse(policyAcceptedAt)
        if (Number.isNaN(parsed)) return new Date().toISOString()
        return new Date(parsed).toISOString()
      })()
      const consentPayload = acceptedTermsVersion || acceptedPrivacyVersion
        ? {
            accepted_terms_version: acceptedTermsVersion ?? TERMS_VERSION,
            accepted_privacy_version: acceptedPrivacyVersion ?? PRIVACY_VERSION,
            policy_accepted_at: consentAcceptedAt,
          }
        : null
      const isNewUser = user.created_at
        ? (Date.now() - new Date(user.created_at).getTime()) < 60_000
        : false
      const normalizedRefCode = refCode ? refCode.toUpperCase() : null
      let firstLoginNeedsOnboarding = false

      await logEvent(userId, 'auth_path_routed', {
        route: 'auth_callback',
        path_category: 'callback',
        auth_method: code ? 'oauth_code' : 'otp_magic_link',
      })

      if (!hasExplicitNext) {
        const { data: onboardingProfile, error: onboardingProfileError } = await supabase
          .from('user_profiles')
          .select('onboarding_completed_at')
          .eq('user_id', userId)
          .maybeSingle()
        if (onboardingProfileError) {
          await logEvent(userId, 'auth_callback_profile_lookup_failed', {
            explicit_next: hasExplicitNext,
            requested_next_path: rawNextParam,
            fallback_redirect_path: nextPath,
            auth_method: code ? 'oauth_code' : 'otp_magic_link',
          })
        }
        if (
          !onboardingProfileError
          && resolveOnboardingDestination({ completedAt: onboardingProfile?.onboarding_completed_at }) === '/onboarding'
        ) {
          resolvedNextPath = '/onboarding'
          firstLoginNeedsOnboarding = true
          response = createClientRedirectResponse(resolvedNextPath, nonce)
        } else {
          resolvedNextPath = '/dashboard'
          response = createClientRedirectResponse(resolvedNextPath, nonce)
        }
      }

      const [, attributionResult] = await Promise.all([
        supabase.from('user_profiles').upsert(
          {
            user_id: userId,
            ...(refCode ? { referred_by: refCode } : {}),
            ...(referrerName ? { referred_by_name: referrerName } : {}),
            ...(referrerCompany ? { referred_by_company: referrerCompany } : {}),
          },
          { onConflict: 'user_id', ignoreDuplicates: true }
        ),
        source
          ? supabase.from('users').update({
              signup_source: source,
              acquisition_channel: utmMedium ?? (refCode ? 'referral' : (selfReportedSource ? 'self_reported' : null)),
              referral_source: source,
              ...(consentPayload ?? {}),
              ...(managerToolsSource ? { trial_ends_at: managerToolsTrialEndsAt } : {}),
            }).eq('id', userId)
          : consentPayload
            ? supabase.from('users').update(consentPayload).eq('id', userId)
          : Promise.resolve(),
        isNewUser
          ? fetch(`${publicOrigin}/api/notify/new-user`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: userEmail,
                username: (user.user_metadata?.full_name ?? user.user_metadata?.name ?? '').trim() || null,
                tier: 'trialing',
                source,
                is_staging: process.env.STAGING === 'true',
              }),
            }).catch(() => {})
          : Promise.resolve(),
        isNewUser && normalizedRefCode
          ? (async () => {
              const admin = createAdminClient()
              const { data: partner } = await admin
                .from('partners')
                .select('id')
          .eq('referral_code', normalizedRefCode)
                .eq('is_active', true)
                .maybeSingle()
              if (partner) {
                await admin.from('referral_attributions').upsert(
                  { signup_user_id: userId, partner_id: partner.id },
                  { onConflict: 'signup_user_id', ignoreDuplicates: true }
                )
              }
            })().catch(() => {})
          : Promise.resolve(),
        logEvent(userId, 'auth_callback_completed', {
          redirect_path: resolvedNextPath,
          explicit_next: hasExplicitNext,
          requested_next_path: rawNextParam,
          first_login_needs_onboarding: firstLoginNeedsOnboarding,
          auth_method: code ? 'oauth_code' : 'otp_magic_link',
          new_user_window: isNewUser,
        }),
      ])

      // Attribution, campaign trial length, and the consent record all ride on
      // one UPDATE. Swallowing its error hid a seven-week outage (SMK-456).
      reportAttributionFailure(
        (attributionResult as { error?: { message?: string; code?: string; details?: string } } | undefined)?.error,
        { path: 'auth_callback', signup_source: source, manager_tools: managerToolsSource },
      )

      return response
    }
  }

  const loginPath = `/login?error=oauth&next=${encodeURIComponent(nextPath)}`
  return createClientRedirectResponse(loginPath, nonce)
}
