'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/email'
import { APP_URL } from '@/lib/config'
import { getOwnerEmail } from '@/lib/email/owner-email'

const OWNER_EMAIL = getOwnerEmail()

export async function markPlaced(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const company = ((formData.get('company') as string) ?? '').trim()

  await supabase.from('user_profiles').update({
    placed_at: new Date().toISOString(),
    placement_company: company || null,
    search_status: 'complete',
    briefing_frequency: 'weekly',
  }).eq('user_id', user.id)

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('user_id', user.id)
    .single()

  const { data: userRow } = await supabase
    .from('users')
    .select('email')
    .eq('id', user.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const email = userRow?.email ?? ''

  // Congratulations email to the user
  if (email) {
    sendEmail({
      to: email,
      subject: `Congratulations, ${firstName}.`,
      html: `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:40px auto;padding:0 16px;color:#334155;">
<p style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 12px 0;">You did it.</p>
<p style="font-size:14px;line-height:1.6;margin:0 0 12px 0;">
  ${company ? `The offer from ${company} is a real accomplishment.` : 'An offer is a real accomplishment.'} The discipline it takes to run a senior-level search well is rare. You did that.
</p>
<p style="font-size:14px;line-height:1.6;margin:0 0 12px 0;">
  Your Starting Monday account is intact. Your companies, contacts, and research history stay with you.
</p>
<p style="font-size:14px;line-height:1.6;margin:0 0 24px 0;">
  Most executives search again within 3 years. When you are ready, everything you built here will be waiting.
</p>
<p style="margin:0 0 24px 0;">
  <a href="${APP_URL}/dashboard" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:600;">Go to my account</a>
</p>
<p style="font-size:13px;color:#334155;margin:0;">Rich Rothschild<br>Founder, Starting Monday</p>
<p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;margin-top:24px;">
  Reply to this email anytime. I read everything.
</p>
</body></html>`,
    }).catch(() => {})
  }

  // Notify Rich
  if (email && OWNER_EMAIL) {
    sendEmail({
      to: OWNER_EMAIL,
      subject: `Placement: ${email}${company ? ` -> ${company}` : ''}`,
      html: `<p style="font-family:sans-serif;font-size:14px;color:#0f172a;">
        <strong>${email}</strong> marked their search as complete${company ? ` (accepted offer from <strong>${company}</strong>)` : ''}.
      </p>`,
    }).catch(() => {})
  }

  redirect('/dashboard/placed')
}
