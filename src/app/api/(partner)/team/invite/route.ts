import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { APP_URL } from '@/lib/config'

function normalizeEmail(value: unknown): string {
  return (value ?? '').toString().trim().toLowerCase()
}

function isValidEmail(email: string): boolean {
  return email.includes('@')
}

function uniqueEmails(items: string[]): string[] {
  return [...new Set(items)]
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth

  const body = await request.json().catch(() => null)
  const singleEmail = normalizeEmail(body?.email)
  const bulkEmails = Array.isArray(body?.emails)
    ? body.emails.map((item: unknown) => normalizeEmail(item))
    : []
  const requestedEmails = uniqueEmails((bulkEmails.length > 0 ? bulkEmails : [singleEmail]).filter(Boolean))

  if (requestedEmails.length === 0) {
    return NextResponse.json({ error: 'At least one email is required.' }, { status: 400 })
  }
  if (requestedEmails.length > 100) {
    return NextResponse.json({ error: 'You can invite up to 100 emails per request.' }, { status: 400 })
  }

  const invalidEmails = requestedEmails.filter((email) => !isValidEmail(email))
  if (invalidEmails.length > 0) {
    return NextResponse.json({ error: `Invalid email(s): ${invalidEmails.join(', ')}` }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('user_id', userId)
    .single()

  // Use admin client to insert so the owner_id RLS policy applies correctly
  const admin = createAdminClient()

  // Enforce seat limit if this user is a partner who purchased seats
  let seatsPurchased = 0
  const { data: currentUser } = await admin.from('users').select('email').eq('id', userId).single()
  if (currentUser?.email) {
    const { data: partner } = await admin
      .from('partners')
      .select('seats_purchased')
      .eq('email', currentUser.email)
      .eq('is_active', true)
      .maybeSingle()
    if (partner && partner.seats_purchased > 0) {
      seatsPurchased = partner.seats_purchased
    }
  }

  const { count: seatCount } = await admin
    .from('team_seats')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId)

  if (seatsPurchased > 0) {
    const used = seatCount ?? 0
    const remaining = Math.max(0, seatsPurchased - used)
    if (remaining <= 0) {
      return NextResponse.json(
        { error: `You have used all ${seatsPurchased} purchased seat${seatsPurchased !== 1 ? 's' : ''}. Purchase more seats to invite additional clients.` },
        { status: 403 },
      )
    }
    if (requestedEmails.length > remaining) {
      return NextResponse.json(
        { error: `You have ${remaining} seat${remaining !== 1 ? 's' : ''} remaining but tried to invite ${requestedEmails.length}.` },
        { status: 403 },
      )
    }
  }

  const inviterName = profile?.full_name ?? 'A colleague'
  const invited: string[] = []
  const duplicates: string[] = []
  const failed: string[] = []

  for (const email of requestedEmails) {
    const { data: seat, error } = await admin
      .from('team_seats')
      .insert({ owner_id: userId, member_email: email })
      .select('token')
      .single()

    if (error) {
      if (error.code === '23505') {
        duplicates.push(email)
        continue
      }
      failed.push(email)
      continue
    }

    const joinUrl = `${APP_URL}/team/join/${seat.token}`
    const sendResult = await sendEmail({
      to: email,
      subject: `${inviterName} gave you access to Starting Monday`,
      html: `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:40px auto;padding:0 16px;color:#334155;">
<p style="font-size:13px;color:#64748b;margin:0 0 20px 0;">
  <strong style="color:#0f172a;">Starting Monday</strong>
</p>
<p style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 8px 0;">
  You have been given access
</p>
<p style="font-size:14px;color:#334155;margin:0 0 16px 0;line-height:1.6;">
  ${inviterName} has activated a seat for you on Starting Monday -- an AI-powered platform for senior executive job searches.
</p>
<p style="font-size:14px;color:#334155;margin:0 0 24px 0;line-height:1.6;">
  Starting Monday gives you daily company intelligence, interview prep briefs, and a full pipeline view of your search.
</p>
<p style="margin:0 0 24px 0;">
  <a href="${joinUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:600;">Accept your seat</a>
</p>
<p style="font-size:13px;color:#64748b;margin:0 0 8px 0;">
  You will be asked to create a free account or log in. Your access is already waiting.
</p>
<p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;margin-top:24px;">
  Starting Monday -- startingmonday.app
</p>
</body></html>`,
    })

    if (sendResult?.error) {
      return NextResponse.json(
        { error: `Invite created, but email delivery failed: ${sendResult.error.message}` },
        { status: 502 },
      )
    }

    invited.push(email)
  }

  if (!bulkEmails.length) {
    if (duplicates.length > 0 && invited.length === 0) {
      return NextResponse.json({ error: 'This email has already been invited.' }, { status: 409 })
    }
    if (failed.length > 0 && invited.length === 0) {
      return NextResponse.json({ error: 'Failed to create invite.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({
    ok: failed.length === 0,
    invitedCount: invited.length,
    duplicateCount: duplicates.length,
    failedCount: failed.length,
    invited,
    duplicates,
    failed,
  })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
