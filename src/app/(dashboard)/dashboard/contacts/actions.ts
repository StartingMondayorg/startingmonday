'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logEvent } from '@/lib/events'
import { captureServerEvent } from '@/lib/posthog-server'
import { str } from '@/lib/form-utils'

export async function addContact(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = str(formData, 'name')
  if (!name) {
    revalidatePath('/dashboard/contacts')
    return
  }

  const title        = str(formData, 'title') || null
  const firm         = str(formData, 'firm') || null
  const rawCompanyId = str(formData, 'company_id') || null
  const channel      = str(formData, 'channel') || null
  const contact_type = str(formData, 'contact_type') || null
  const email        = str(formData, 'email') || null
  const linkedin_url = str(formData, 'linkedin_url') || null
  const notes        = str(formData, 'notes') || null

  // Verify the company belongs to this user before associating the contact.
  let companyId: string | null = null
  if (rawCompanyId) {
    const { data: co } = await supabase
      .from('companies')
      .select('id')
      .eq('id', rawCompanyId)
      .eq('user_id', user.id)
      .maybeSingle()
    companyId = co?.id ?? null
  }

  const { error: insertError } = await supabase.from('contacts').insert({
    user_id: user.id,
    company_id: companyId,
    name,
    title,
    firm,
    channel,
    contact_type,
    email,
    linkedin_url,
    notes,
    status: 'active',
  })

  if (insertError) {
    revalidatePath('/dashboard/contacts')
    redirect('/dashboard/contacts?error=save-failed')
  }

  await logEvent(user.id, 'contact_added', { channel: channel ?? '' })
  captureServerEvent(user.id, 'contact_added', { channel: channel ?? '' })
  revalidatePath('/dashboard/contacts')
  redirect('/dashboard/contacts?saved=1')
}

export async function markContactSent(contactId: string, contactName: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'You must be signed in to mark outreach as sent.' }

  const followUpDate = new Date()
  followUpDate.setDate(followUpDate.getDate() + 5)
  const followUpDateStr = followUpDate.toISOString().slice(0, 10)
  const followUpAction = `Follow up with ${contactName}`

  const { data: existingFollowUp } = await supabase
    .from('follow_ups')
    .select('id')
    .eq('user_id', user.id)
    .eq('contact_id', contactId)
    .eq('status', 'pending')
    .eq('action', followUpAction)
    .gte('due_date', new Date().toISOString().slice(0, 10))
    .limit(1)
    .maybeSingle()

  const [{ error: updateError }, followUpResult] = await Promise.all([
    supabase
      .from('contacts')
      .update({ contacted_at: new Date().toISOString() })
      .eq('id', contactId)
      .eq('user_id', user.id),
    existingFollowUp
      ? Promise.resolve({ error: null })
      : supabase.from('follow_ups').insert({
          user_id: user.id,
          contact_id: contactId,
          action: followUpAction,
          due_date: followUpDateStr,
          status: 'pending',
        }),
  ])

  if (updateError) {
    return { ok: false, error: `Could not mark ${contactName} as sent: ${updateError.message}` }
  }
  if (followUpResult.error) {
    return { ok: false, error: `Marked ${contactName} as sent, but could not create the follow-up reminder: ${followUpResult.error.message}` }
  }
  return { ok: true }
}

export async function markContactSentForm(contactId: string, contactName: string): Promise<void> {
  const result = await markContactSent(contactId, contactName)
  if (!result.ok) return
  revalidatePath(`/dashboard/contacts/${contactId}`)
  redirect(`/dashboard/contacts/${contactId}?sent=1`)
}

export async function updateOutreachStatus(contactId: string, status: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: contact } = await supabase
    .from('contacts')
    .select('name')
    .eq('id', contactId)
    .eq('user_id', user.id)
    .maybeSingle()

  await supabase
    .from('contacts')
    .update({ outreach_status: status })
    .eq('id', contactId)
    .eq('user_id', user.id)

  if (status === 'meeting_scheduled' && contact?.name) {
    const meetingAction = `Schedule meeting with ${contact.name}`
    const tomorrow = new Date(Date.now() + 86400_000).toISOString().slice(0, 10)

    const { data: existingMeetingFollowUp } = await supabase
      .from('follow_ups')
      .select('id')
      .eq('user_id', user.id)
      .eq('contact_id', contactId)
      .eq('status', 'pending')
      .eq('action', meetingAction)
      .limit(1)
      .maybeSingle()

    if (!existingMeetingFollowUp) {
      await supabase.from('follow_ups').insert({
        user_id: user.id,
        contact_id: contactId,
        action: meetingAction,
        due_date: tomorrow,
        status: 'pending',
      })
    }
  }

  if (status === 'closed') {
    await supabase
      .from('follow_ups')
      .update({ status: 'completed' })
      .eq('user_id', user.id)
      .eq('contact_id', contactId)
      .eq('status', 'pending')
  }

  revalidatePath(`/dashboard/contacts/${contactId}`)
  revalidatePath('/dashboard/contacts')
  revalidatePath('/dashboard/follow-ups')
}

export async function remindLater(contactId: string, contactName: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'You must be signed in to create a reminder.' }

  const due = new Date()
  due.setDate(due.getDate() + 1)
  const dueDate = due.toISOString().slice(0, 10)

  const { error } = await supabase.from('follow_ups').insert({
    user_id: user.id,
    contact_id: contactId,
    action: `Send outreach to ${contactName}`,
    due_date: dueDate,
    status: 'pending',
  })

  if (error) {
    return { ok: false, error: `Could not create a reminder for ${contactName}: ${error.message}` }
  }

  return { ok: true }
}

export async function scheduleMeetingFollowUp(contactId: string, contactName: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const action = `Schedule meeting with ${contactName}`
  const dueDate = new Date(Date.now() + 86400_000).toISOString().slice(0, 10)

  const { data: existing } = await supabase
    .from('follow_ups')
    .select('id')
    .eq('user_id', user.id)
    .eq('contact_id', contactId)
    .eq('status', 'pending')
    .eq('action', action)
    .limit(1)
    .maybeSingle()

  if (!existing) {
    await supabase.from('follow_ups').insert({
      user_id: user.id,
      contact_id: contactId,
      action,
      due_date: dueDate,
      status: 'pending',
    })
  }

  revalidatePath(`/dashboard/contacts/${contactId}`)
  revalidatePath('/dashboard/follow-ups')
  redirect(`/dashboard/contacts/${contactId}?meeting=1`)
}

export async function archiveContact(contactId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('contacts')
    .update({ status: 'archived' })
    .eq('id', contactId)
    .eq('user_id', user.id)

  revalidatePath('/dashboard/contacts')
  redirect('/dashboard/contacts')
}

export async function toggleContactPriority(contactId: string, current: boolean): Promise<{ ok: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  const { error } = await supabase
    .from('contacts')
    .update({ is_priority: !current })
    .eq('id', contactId)
    .eq('user_id', user.id)

  if (!error) {
    revalidatePath('/dashboard/contacts')
  }
  return { ok: !error }
}

export async function archiveContactSilent(contactId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('contacts')
    .update({ status: 'archived' })
    .eq('id', contactId)
    .eq('user_id', user.id)

  revalidatePath('/dashboard/contacts')
  revalidatePath('/dashboard')
}
