'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { str } from '@/lib/form-utils'

async function requireStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const staff = await getStaffMember(user)
  return staff ? { user, staff } : null
}

export async function addContact(formData: FormData) {
  const auth = await requireStaff()
  if (!auth) return

  const prospectId = str(formData, 'prospect_id')
  const name       = str(formData, 'name')
  if (!prospectId || !name) return

  const admin = createAdminClient()
  await admin.from('b2b_contacts').insert({
    prospect_id:  prospectId,
    name,
    title:        str(formData, 'title'),
    email:        str(formData, 'email'),
    linkedin_url: str(formData, 'linkedin_url'),
    notes:        str(formData, 'notes'),
  })

  revalidatePath(`/dashboard/admin/b2b/${prospectId}`)
}

export async function logActivity(formData: FormData) {
  const auth = await requireStaff()
  if (!auth) return

  const prospectId    = str(formData, 'prospect_id')
  const summary       = str(formData, 'summary')
  if (!prospectId || !summary) return

  const occurredAt    = str(formData, 'occurred_at') || new Date().toISOString().split('T')[0]
  const nextActionDue = str(formData, 'next_action_due') || null

  const admin = createAdminClient()
  await admin.from('b2b_activities').insert({
    prospect_id:     prospectId,
    activity_type:   str(formData, 'activity_type') ?? 'other',
    summary,
    occurred_at:     occurredAt,
    next_action:     str(formData, 'next_action'),
    next_action_due: nextActionDue,
    logged_by:       auth.user.email,
  })

  await admin
    .from('b2b_prospects')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', prospectId)

  revalidatePath(`/dashboard/admin/b2b/${prospectId}`)
  revalidatePath('/dashboard/admin/b2b')
}

export async function updateProspect(formData: FormData) {
  const auth = await requireStaff()
  if (!auth) return

  const id = str(formData, 'id')
  if (!id) return

  const admin = createAdminClient()
  await admin
    .from('b2b_prospects')
    .update({
      name:            str(formData, 'name'),
      website:         str(formData, 'website'),
      notes:           str(formData, 'notes'),
      updated_at:      new Date().toISOString(),
    })
    .eq('id', id)

  revalidatePath(`/dashboard/admin/b2b/${id}`)
  revalidatePath('/dashboard/admin/b2b')
}

export async function saveMaterial(formData: FormData) {
  const auth = await requireStaff()
  if (!auth) return

  const prospectId = str(formData, 'prospect_id')
  const title      = str(formData, 'title')
  const content    = str(formData, 'content')
  if (!prospectId || !title || !content) return

  const admin = createAdminClient()
  await admin.from('b2b_materials').insert({
    prospect_id: prospectId,
    title,
    content,
    created_by: auth.user.email,
  })

  revalidatePath(`/dashboard/admin/b2b/${prospectId}`)
}

export async function deleteMaterial(formData: FormData) {
  const auth = await requireStaff()
  if (!auth) return

  const id         = str(formData, 'id')
  const prospectId = str(formData, 'prospect_id')
  if (!id) return

  const admin = createAdminClient()
  await admin.from('b2b_materials').delete().eq('id', id)

  revalidatePath(`/dashboard/admin/b2b/${prospectId}`)
}
