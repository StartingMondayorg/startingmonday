import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkBurstLimit } from '@/lib/burst-limit'
import { sendEmail } from '@/lib/email'
import { getNotifyEmails } from '@/lib/owner-email'
import { enforcePublicEndpointGuard } from '@/lib/public-endpoint-guard'

const OWNER_EMAIL = 'richard@startingmonday.app'

type AssistKind = 'feedback' | 'question'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function POST(request: NextRequest) {
  const guard = await enforcePublicEndpointGuard({
    request,
    rateLimitKey: 'api:assist',
    maxPerMinute: 20,
  })
  if (guard) return guard

  const forwardedFor = request.headers.get('x-forwarded-for') ?? ''
  const ip = forwardedFor.split(',')[0]?.trim() || 'unknown'
  const userAgent = request.headers.get('user-agent') ?? 'unknown'
  if (!(await checkBurstLimit(`assist:${ip}:${userAgent.slice(0, 40)}`))) {
    return NextResponse.json({ error: 'Too many requests. Wait a moment.' }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const kind: AssistKind = body?.kind === 'question' ? 'question' : 'feedback'
  const message = (body?.message ?? '').toString().trim()
  const contactEmail = (body?.email ?? '').toString().trim().slice(0, 200) || null
  const page = (body?.page ?? '').toString().trim().slice(0, 300) || '(unknown page)'

  if (message.length < 10) {
    return NextResponse.json({ error: 'Please write at least 10 characters.' }, { status: 400 })
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: 'Message is too long (2000 character max).' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()
  const kindLabel = kind === 'question' ? 'Question' : 'Feedback'
  const title = `${kindLabel}: ${message.slice(0, 160)}${message.length > 160 ? '...' : ''}`

  let stored = false
  if (user) {
    // Authenticated: store on the shared feedback board (visible on feedback + support pages).
    const feedbackItems = admin.from('feedback_items') as unknown as {
      insert: (values: Record<string, unknown>) => Promise<{ error: { message?: string } | null }>
    }
    const { error } = await feedbackItems.insert({
      type: 'feedback',
      title: title.slice(0, 200),
      body: `${message}\n\n[Submitted from ${page}]`,
      category: 'other',
      user_id: user.id,
      status: 'new',
    })
    stored = !error
    if (error) {
      console.error(JSON.stringify({ ts: new Date().toISOString(), event: 'assist_insert_error', error: error.message }))
    }
  }

  if (!stored) {
    // Anonymous visitors (or fallback): store in the public feedback store.
    const { error } = await admin.from('testimonials').insert({
      invite_code: null,
      body: `[${kindLabel}] [${page}]${contactEmail ? ` [${contactEmail}]` : ''} ${message}`.slice(0, 1000),
    })
    if (error) {
      return NextResponse.json({ error: 'Failed to save. Please try again.' }, { status: 500 })
    }
  }

  void notifyOwner({ kind: kindLabel, message, page, contactEmail, userEmail: user?.email ?? null })

  return NextResponse.json({ ok: true })
}

async function notifyOwner({
  kind,
  message,
  page,
  contactEmail,
  userEmail,
}: {
  kind: string
  message: string
  page: string
  contactEmail: string | null
  userEmail: string | null
}) {
  const from = userEmail ?? contactEmail ?? 'anonymous visitor'
  const now = new Date().toLocaleString('en-US', {
    timeZone: 'America/Chicago', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })

  try {
    const recipients = [...new Set([OWNER_EMAIL, ...getNotifyEmails()])]
    await sendEmail({
      to: recipients.length === 1 ? recipients[0] : recipients,
      subject: `New ${kind.toLowerCase()} from ${from}`,
      bypassCouncil: true,
      html: `
        <p style="font-family:sans-serif;font-size:14px;color:#0f172a;margin:0 0 12px 0;">
          New ${escapeHtml(kind.toLowerCase())} submitted on Starting Monday.
        </p>
        <table style="font-family:sans-serif;font-size:13px;color:#334155;border-collapse:collapse;margin-bottom:16px;">
          <tr><td style="padding:4px 16px 4px 0;color:#64748b;">Time</td><td>${now} CT</td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#64748b;">From</td><td>${escapeHtml(from)}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#64748b;">Page</td><td>${escapeHtml(page)}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#64748b;">Type</td><td>${escapeHtml(kind)}</td></tr>
        </table>
        <p style="font-family:sans-serif;font-size:14px;color:#0f172a;margin:0;background:#f8fafc;padding:12px;border-left:3px solid #f97316;border-radius:2px;">
          ${escapeHtml(message).replace(/\n/g, '<br>')}
        </p>
      `,
    })
  } catch (err) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), event: 'assist_email_error', error: String(err) }))
  }

  // Slack notification intentionally skipped for now (owner request, 2026-07-12).
}
