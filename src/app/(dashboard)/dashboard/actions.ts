'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { str } from '@/lib/form-utils'

export async function markFollowUpDone(formData: FormData) {
  const id = str(formData, 'id')
  if (!id) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('follow_ups')
    .update({ status: 'completed' })
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/calendar')
  revalidatePath('/dashboard/contacts', 'layout')
}

export async function updateFollowUp(formData: FormData) {
  const id = str(formData, 'id')
  const action = str(formData, 'action')
  const due_date = str(formData, 'due_date')

  if (!id || !action) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const update: Record<string, string> = { action }
  if (due_date) update.due_date = due_date

  await supabase
    .from('follow_ups')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/dashboard')
}
