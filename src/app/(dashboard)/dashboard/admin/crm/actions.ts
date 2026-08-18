'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'
import { runLeadScoringPass } from '@/lib/intelligence/lead-scoring-runner'

export async function runLeadScoringNow(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) {
    redirect('/dashboard/admin/crm?error=forbidden')
  }

  try {
    const result = await runLeadScoringPass({
      limit: 2000,
      dryRun: false,
      trigger: 'admin',
      initiatedByUserId: user.id,
    })
    redirect(`/dashboard/admin/crm?scored=1&processed=${result.processed}&updated=${result.updated}`)
  } catch {
    redirect('/dashboard/admin/crm?error=run-failed')
  }
}
