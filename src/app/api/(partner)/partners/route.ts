import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { enforcePublicEndpointGuard } from '@/lib/public-endpoint-guard'
import { getOwnerEmail } from '@/lib/owner-email'

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

function generateReferralCode(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase()
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://startingmonday.app'
const OWNER_EMAIL = getOwnerEmail()

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const name      = (body?.name      ?? '').toString().trim()
  const email     = (body?.email     ?? '').toString().trim().toLowerCase()
  const company   = (body?.company   ?? '').toString().trim()
  const role      = (body?.role      ?? '').toString().trim()
  const how_heard = (body?.how_heard ?? '').toString().trim() || null
  const interests = (body?.interests ?? '').toString().trim() || null

  const blocked = await enforcePublicEndpointGuard({
    request,
    rateLimitKey: 'partners-inquiry',
    maxPerMinute: 3,
  })
  if (blocked) return blocked

  if (!name || !email || !company || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Store the inquiry (existing flow)
  await admin.from('partner_inquiries').insert({ name, company, role, how_heard, interests })

  // Create partner record with a unique referral code
  let referralCode = generateReferralCode()
  // Retry once on collision (extremely unlikely)
  const { data: existing } = await admin.from('partners').select('id').eq('referral_code', referralCode).maybeSingle()
  if (existing) referralCode = generateReferralCode()

  const { error: partnerError } = await admin.from('partners').upsert(
    { name, email, company: company || null, referral_code: referralCode },
    { onConflict: 'email', ignoreDuplicates: false }
  )

  const referralLink = `${APP_URL}/signup?ref=${referralCode}`

  // Notify Rich
  sendEmail({
    to: OWNER_EMAIL ?? '',
    subject: `Partner inquiry: ${name} at ${company}`,
    html: `
      <p><strong>Name:</strong> ${escHtml(name)}</p>
      <p><strong>Email:</strong> ${escHtml(email)}</p>
      <p><strong>Company:</strong> ${escHtml(company)}</p>
      <p><strong>Role:</strong> ${escHtml(role)}</p>
      <p><strong>Partnership type:</strong> ${escHtml(interests ?? 'Not specified')}</p>
      <p><strong>How they heard:</strong> ${escHtml(how_heard ?? 'Not specified')}</p>
      ${!partnerError ? `<p><strong>Referral code:</strong> ${escHtml(referralCode)}</p>
      <p><strong>Referral link:</strong> <a href="${escHtml(referralLink)}">${escHtml(referralLink)}</a></p>` : ''}
    `,
  }).catch((error) => {
    console.error(JSON.stringify({
      ts: new Date().toISOString(),
      event: 'partner_inquiry_notification_failed',
      email,
      message: error instanceof Error ? error.message : String(error),
    }))
  })

  // Send confirmation to partner with their referral link
  if (!partnerError) {
    const firstName = name.split(' ')[0]
    sendEmail({
      to: email,
      subject: 'Welcome to the Starting Monday partner program',
      html: `
        <p>Hi ${escHtml(firstName)},</p>
        <p>Thanks for your interest in partnering with Starting Monday. We will be in touch within 2 business days to discuss next steps.</p>
        <p>In the meantime, here is your referral link. Any senior executive who signs up through this link will be attributed to you:</p>
        <p style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px 16px;border-radius:4px;font-family:monospace;font-size:14px;">
          <a href="${escHtml(referralLink)}">${escHtml(referralLink)}</a>
        </p>
        <p>Your referral code is <strong>${escHtml(referralCode)}</strong>. When an executive you refer converts to a paid subscriber, you earn ${20}% of their monthly subscription for as long as they remain active.</p>
        <p>You can track your referred subscribers and estimated commission at:<br>
          <a href="${escHtml(APP_URL)}/dashboard/partner">${escHtml(APP_URL)}/dashboard/partner</a>
        </p>
        <p>If you have questions before we connect, reply to this email.</p>
        <p>Rich Rothschild<br>Starting Monday</p>
      `,
    }).catch((error) => {
      console.error(JSON.stringify({
        ts: new Date().toISOString(),
        event: 'partner_confirmation_email_failed',
        email,
        message: error instanceof Error ? error.message : String(error),
      }))
    })
  }

  return NextResponse.json({ ok: true })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
