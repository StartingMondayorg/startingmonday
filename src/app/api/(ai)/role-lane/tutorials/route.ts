import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { getManagerToolsBridge, getRecruiterToolkit, getRoleLaneTutorials } from '@/lib/role-lane-learning'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role_family, role_title')
    .eq('user_id', auth.userId)
    .single()

  const roleFamily = (profile?.role_family as 'leadership' | 'technical_leadership' | 'delivery_leadership' | null | undefined) ?? null
  const roleTitle = (profile?.role_title as
    | 'manager'
    | 'senior_manager'
    | 'director'
    | 'senior_director'
    | 'avp'
    | 'vp'
    | 'executive'
    | 'technical_lead'
    | 'senior_technical_lead'
    | 'principal'
    | 'senior_principal'
    | 'architect'
    | 'senior_architect'
    | 'project_manager'
    | 'senior_project_manager'
    | 'program_manager'
    | 'senior_program_manager'
    | 'tpm'
    | 'senior_tpm'
    | null
    | undefined) ?? null

  return NextResponse.json({
    ok: true,
    roleFamily,
    roleTitle,
    tutorials: getRoleLaneTutorials(roleFamily),
    managerToolsBridge: getManagerToolsBridge(roleTitle),
    recruiterToolkit: getRecruiterToolkit(roleFamily, roleTitle),
  })
}
