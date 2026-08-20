/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'

function pickWorkflow(input: {
  roleType: string | null
  roleFamily: string | null
  roleTitle: string | null
  workflowVariant: string | null
  subscriptionTier: string | null
  companyCount: number
  contactCount: number
}): { key: string; reason: string } {
  if ((input.workflowVariant ?? '').length > 0) {
    return {
      key: input.workflowVariant ?? 'momentum_execution',
      reason: 'Workflow variant selected from role-aware onboarding profile.',
    }
  }
  if ((input.subscriptionTier ?? '') === 'executive') {
    return { key: 'executive_concierge', reason: 'Executive tier users get concierge workflow by default.' }
  }
  if ((input.roleFamily ?? '') === 'technical_leadership') {
    return { key: 'technical_leadership_transition', reason: 'Technical leadership profile selected.' }
  }
  if ((input.roleFamily ?? '') === 'delivery_leadership') {
    return { key: 'delivery_leadership_transition', reason: 'Delivery leadership profile selected.' }
  }
  if ((input.roleTitle ?? '').toLowerCase() === 'executive') {
    return { key: 'executive_transition', reason: 'Leadership executive profile selected.' }
  }
  if ((input.roleType ?? '').toLowerCase().includes('board')) {
    return { key: 'board_transition', reason: 'Role type indicates board/advisory path.' }
  }
  if (input.companyCount === 0) {
    return { key: 'target_buildout', reason: 'No active companies yet; prioritize target buildout.' }
  }
  if (input.contactCount === 0) {
    return { key: 'relationship_activation', reason: 'No active contacts yet; prioritize relationship activation.' }
  }
  return { key: 'momentum_execution', reason: 'Profile and pipeline present; move to execution workflow.' }
}

export async function POST(request: NextRequest) {
  const authCheck = await requireAuth(request)
  if (!authCheck.ok) return authCheck.response

  const auth = await requireStaffAutomationAccess(request)
  if (!auth.ok) return auth.response

  const { userId, supabase } = auth
  const sb = supabase as any

  const [{ data: profile }, { data: userRow }, { count: companyCount }, { count: contactCount }] = await Promise.all([
    supabase.from('user_profiles').select('role_type, role_family, role_title, workflow_variant').eq('user_id', userId).maybeSingle(),
    supabase.from('users').select('subscription_tier').eq('id', userId).maybeSingle(),
    supabase.from('companies').select('id', { count: 'exact', head: true }).eq('user_id', userId).is('archived_at', null),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'active'),
  ])

  const workflow = pickWorkflow({
    roleType: profile?.role_type ?? null,
    roleFamily: profile?.role_family ?? null,
    roleTitle: profile?.role_title ?? null,
    workflowVariant: profile?.workflow_variant ?? null,
    subscriptionTier: userRow?.subscription_tier ?? null,
    companyCount: companyCount ?? 0,
    contactCount: contactCount ?? 0,
  })

  const { data: inserted, error } = await sb
    .from('onboarding_workflow_assignments')
    .insert({ user_id: userId, workflow_key: workflow.key, assignment_reason: workflow.reason, status: 'active' })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: 'Failed to assign workflow' }, { status: 500 })
  return NextResponse.json({ ok: true, assignmentId: inserted?.id, workflow })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
