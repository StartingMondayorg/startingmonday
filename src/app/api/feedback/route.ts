import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkBurstLimit } from '@/lib/burst-limit'
import { sendEmail } from '@/lib/email/email'
import { getNotifyEmails } from '@/lib/email/owner-email'
import { anthropic, MODELS, TEMP } from '@/lib/anthropic'
import { enforcePublicEndpointGuard } from '@/lib/public-endpoint-guard'

export async function POST(request: NextRequest) {
  const guard = await enforcePublicEndpointGuard({
    request,
    rateLimitKey: 'api:feedback',
    maxPerMinute: 20,
  })
  if (guard) return guard

  const forwardedFor = request.headers.get('x-forwarded-for') ?? ''
  const ip = forwardedFor.split(',')[0]?.trim() || 'unknown'
  const userAgent = request.headers.get('user-agent') ?? 'unknown'
  const burstKey = `feedback:${ip}:${userAgent.slice(0, 40)}`

  if (!(await checkBurstLimit(burstKey))) {
    return NextResponse.json({ error: 'Too many requests. Wait a moment.' }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const text = (body?.text ?? '').toString().trim()
  const inviteCode = (body?.invite_code ?? '').toString().trim() || null

  if (!text || text.length < 3) {
    return NextResponse.json({ error: 'Too short' }, { status: 400 })
  }
  if (text.length > 1000) {
    return NextResponse.json({ error: 'Too long' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('testimonials').insert({
    invite_code: inviteCode,
    body: text,
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  const host = request.headers.get('host') ?? ''
  // fire-and-forget: notify admins with AI sentiment analysis
  void notifyAdmins(text, inviteCode, host)

  return NextResponse.json({ ok: true })
}

async function notifyAdmins(feedbackText: string, inviteCode: string | null, host: string) {
  const notifyEmails = getNotifyEmails()
  if (notifyEmails.length === 0) return

  try {
    const analysisText = await analyzeSentiment(feedbackText)
    const now = new Date().toLocaleString('en-US', {
      timeZone: 'America/Chicago', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
    const isStaging = !host.endsWith('startingmonday.app')

    const inviteRow = inviteCode
      ? `<tr><td style="padding:4px 16px 4px 0;color:#64748b;">Invite code</td><td>${inviteCode}</td></tr>`
      : ''

    await sendEmail({
      to: notifyEmails.length === 1 ? notifyEmails[0] : notifyEmails,
      subject: isStaging ? 'New Feedback! - staging' : 'New Feedback!',
      bypassCouncil: true,
      html: `
        <p style="font-family:sans-serif;font-size:14px;color:#0f172a;margin:0 0 12px 0;">
          Heads up &#8212; you've got new feedback.
        </p>
        <table style="font-family:sans-serif;font-size:13px;color:#334155;border-collapse:collapse;margin-bottom:16px;">
          <tr><td style="padding:4px 16px 4px 0;color:#64748b;">Time</td><td>${now} CT</td></tr>
          ${inviteRow}
        </table>
        <p style="font-family:sans-serif;font-size:13px;color:#64748b;margin:0 0 4px 0;font-weight:600;">Feedback</p>
        <p style="font-family:sans-serif;font-size:14px;color:#0f172a;margin:0 0 16px 0;background:#f8fafc;padding:12px;border-left:3px solid #3b82f6;border-radius:2px;">
          ${feedbackText.replace(/\n/g, '<br>')}
        </p>
        <p style="font-family:sans-serif;font-size:13px;color:#64748b;margin:0 0 4px 0;font-weight:600;">Analysis</p>
        <p style="font-family:sans-serif;font-size:13px;color:#334155;margin:0;white-space:pre-line;">${analysisText}</p>
      `,
    })
  } catch (err) {
    console.error(JSON.stringify({
      ts: new Date().toISOString(),
      event: 'feedback_notify_error',
      error: String(err),
    }))
  }
}

async function analyzeSentiment(text: string): Promise<string> {
  try {
    const msg = await anthropic.messages.create({
      model: MODELS.haiku,
      max_tokens: 300,
      temperature: TEMP.extract,
      messages: [{
        role: 'user',
        content: `Analyze this user feedback for an executive job search platform.

Feedback: "${text}"

Respond in exactly this format (no extra text):
Sentiment: [positive | negative | mixed]
Key takeaways:
- [takeaway 1]
- [takeaway 2]
- [takeaway 3 if warranted]`,
      }],
    })

    return msg.content[0].type === 'text' ? msg.content[0].text.trim() : 'Analysis unavailable'
  } catch {
    return 'Analysis unavailable'
  }
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
