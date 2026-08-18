import { type NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { enforcePublicEndpointGuard } from '@/lib/public-endpoint-guard'
import { getNotifyEmails } from '@/lib/owner-email'

const TIER_LABELS: Record<string, string> = {
  trialing:  'Free trial',
  passive:   'Monitor ($49/mo)',
  active:    'Active ($199/mo)',
  executive: 'Executive ($499/mo)',
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const email    = (body?.email    ?? '').toString().trim()
  const username = (body?.username ?? '').toString().trim() || null
  const tier     = (body?.tier     ?? 'trialing').toString().trim()
  const source   = (body?.source   ?? '').toString().trim() || null
  const isStaging = body?.is_staging === true

  const blocked = await enforcePublicEndpointGuard({
    request,
    rateLimitKey: 'notify-new-user',
    maxPerMinute: 5,
  })
  if (blocked) return blocked

  const notifyEmails = getNotifyEmails()
  if (!email || notifyEmails.length === 0) return NextResponse.json({ ok: true })

  const tierLabel = TIER_LABELS[tier] ?? tier
  const now = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  const usernameRow = username
    ? `<tr><td style="padding:4px 16px 4px 0;color:#64748b;">Name</td><td>${username}</td></tr>`
    : ''

  void sendEmail({
    to: notifyEmails.length === 1 ? notifyEmails[0] : notifyEmails,
    subject: isStaging ? 'New User Registered! - staging' : 'New User Registered!',
    bypassCouncil: true,
    html: `
      <p style="font-family:sans-serif;font-size:14px;color:#0f172a;margin:0 0 12px 0;">
        Heads up &#8212; another new user just registered.
      </p>
      <table style="font-family:sans-serif;font-size:13px;color:#334155;border-collapse:collapse;">
        <tr><td style="padding:4px 16px 4px 0;color:#64748b;">Email</td><td><strong>${email}</strong></td></tr>
        ${usernameRow}
        <tr><td style="padding:4px 16px 4px 0;color:#64748b;">Plan</td><td>${tierLabel}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#64748b;">Time</td><td>${now} CT</td></tr>
        ${source ? `<tr><td style="padding:4px 16px 4px 0;color:#64748b;">Source</td><td>${source}</td></tr>` : ''}
      </table>
    `,
  }).catch((error) => {
    console.error(JSON.stringify({
      ts: new Date().toISOString(),
      event: 'notify_new_user_email_failed',
      email,
      message: error instanceof Error ? error.message : String(error),
    }))
  })

  return NextResponse.json({ ok: true })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
