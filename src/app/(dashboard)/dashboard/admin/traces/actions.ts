'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'

export async function rateTrace(traceId: string, evalPass: boolean | null, evalNotes: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  const staff = await getStaffMember(user)
  if (!staff) return { ok: false }

  const adminClient = createAdminClient()
  await adminClient
    .from('llm_traces')
    .update({ eval_pass: evalPass, eval_notes: evalNotes || null })
    .eq('id', traceId)

  return { ok: true }
}
