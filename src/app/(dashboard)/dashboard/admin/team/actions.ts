'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember, addStaffMember, updateStaffRole, removeStaffMember } from '@/lib/staff'
import type { StaffRole } from '@/lib/staff'

async function requireOwner() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null
  const staff = await getStaffMember(user)
  if (staff?.role !== 'owner') return null
  return staff
}

export async function addTeamMember(_prev: unknown, formData: FormData): Promise<{ error?: string }> {
  const caller = await requireOwner()
  if (!caller) return { error: 'Only owners can add team members.' }

  const email = (formData.get('email') as string ?? '').toLowerCase().trim()
  const role  = formData.get('role') as StaffRole

  if (!email || !['admin', 'viewer'].includes(role)) {
    return { error: 'Invalid email or role.' }
  }

  const ok = await addStaffMember(email, role, caller.email)
  if (!ok) return { error: 'Could not add member. That email may already exist.' }

  revalidatePath('/dashboard/admin/team')
  revalidatePath('/dashboard/admin')
  return {}
}

export async function changeTeamRole(id: string, role: StaffRole): Promise<{ error?: string }> {
  const caller = await requireOwner()
  if (!caller) return { error: 'Only owners can change roles.' }

  const ok = await updateStaffRole(id, role)
  if (!ok) return { error: 'Failed to update role.' }

  revalidatePath('/dashboard/admin/team')
  revalidatePath('/dashboard/admin')
  return {}
}

export async function removeTeamMember(id: string): Promise<{ error?: string }> {
  const caller = await requireOwner()
  if (!caller) return { error: 'Only owners can remove members.' }

  const ok = await removeStaffMember(id)
  if (!ok) return { error: 'Failed to remove member.' }

  revalidatePath('/dashboard/admin/team')
  revalidatePath('/dashboard/admin')
  return {}
}
