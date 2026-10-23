'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { str, numOrNull } from '@/lib/form-utils'

async function requireStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const staff = await getStaffMember(user)
  return staff ? { user, staff } : null
}

export async function createProspect(formData: FormData) {
  const auth = await requireStaff()
  if (!auth) return

  const name    = str(formData, 'name')
  const type    = str(formData, 'type') ?? 'other'
  const website = str(formData, 'website')
  const notes   = str(formData, 'notes')
  const seats   = numOrNull(formData, 'estimated_seats')
  const arr     = numOrNull(formData, 'estimated_arr')

  if (!name) return

  const admin = createAdminClient()
  const { data } = await admin
    .from('b2b_prospects')
    .insert({ name, type, website, notes, estimated_seats: seats, estimated_arr: arr })
    .select('id')
    .single()

  if (data?.id) {
    redirect(`/dashboard/admin/b2b/${data.id}`)
  }
}

export async function updateProspectStage(formData: FormData) {
  const auth = await requireStaff()
  if (!auth) return

  const id    = str(formData, 'id')
  const stage = str(formData, 'stage')
  if (!id || !stage) return

  const admin = createAdminClient() as any
  const updatePayload: Record<string, string> = {
    stage,
    updated_at: new Date().toISOString(),
  }

  if (['proposal_sent', 'negotiating', 'closed_won', 'closed_lost'].includes(stage)) {
    updatePayload.qualified_at = new Date().toISOString()
  }
  if (stage === 'closed_won') {
    updatePayload.pilot_approved_at = new Date().toISOString()
  }

  const primaryUpdate = await admin
    .from('b2b_prospects')
    .update(updatePayload)
    .eq('id', id)

  // Fallback for environments where timestamp columns are not migrated yet.
  if (primaryUpdate.error) {
    await admin
      .from('b2b_prospects')
      .update({ stage, updated_at: new Date().toISOString() })
      .eq('id', id)
  }

  revalidatePath('/dashboard/admin/b2b')
  revalidatePath(`/dashboard/admin/b2b/${id}`)
}

export async function archiveProspect(formData: FormData) {
  const auth = await requireStaff()
  if (!auth) return

  const id = str(formData, 'id')
  if (!id) return

  const admin = createAdminClient()
  await admin
    .from('b2b_prospects')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)

  revalidatePath('/dashboard/admin/b2b')
  redirect('/dashboard/admin/b2b')
}
