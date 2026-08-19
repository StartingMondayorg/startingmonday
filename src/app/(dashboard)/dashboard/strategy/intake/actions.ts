'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function parseCsv(raw: string) {
  return raw.split(',').map(item => item.trim()).filter(Boolean)
}

function toNullableString(value: FormDataEntryValue | null) {
  const text = (value as string | null ?? '').trim()
  if (text.length === 0 || text === '__none__') return null
  return text
}

export async function saveStrategyIntake(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const audience = (formData.get('audience') as string ?? 'individual') === 'partner' ? 'partner' : 'individual'
  const positioningSummary = toNullableString(formData.get('positioning_summary'))

  const targetTitles = parseCsv((formData.get('target_titles') as string ?? ''))
  const targetSectors = parseCsv((formData.get('target_sectors') as string ?? ''))
  const targetLocations = parseCsv((formData.get('target_locations') as string ?? ''))

  const rolesToAvoid = parseCsv((formData.get('roles_to_avoid') as string ?? ''))
  const targetCompanies = parseCsv((formData.get('target_companies') as string ?? ''))
  const relationshipTargets = parseCsv((formData.get('relationship_targets') as string ?? ''))
  const redFlags = parseCsv((formData.get('red_flags') as string ?? ''))
  const decisionCriteria = parseCsv((formData.get('decision_criteria') as string ?? ''))

  const missingRequired: string[] = []
  if (targetTitles.length === 0) missingRequired.push('Target roles')
  if (!toNullableString(formData.get('transition_type'))) missingRequired.push('Transition type')
  if (!toNullableString(formData.get('search_stage'))) missingRequired.push('Search stage')
  if (targetSectors.length === 0) missingRequired.push('Target industries')
  if (!positioningSummary) missingRequired.push('Positioning summary')
  if (decisionCriteria.length === 0) missingRequired.push('Decision criteria')

  if (missingRequired.length > 0) {
    redirect(`/dashboard/strategy/intake?error=${encodeURIComponent(`Missing required fields: ${missingRequired.join(', ')}`)}&audience=${audience}`)
  }

  const { data: existing } = await supabase
    .from('user_profiles')
    .select('role_context')
    .eq('user_id', user.id)
    .single()

  const roleContext = (existing?.role_context as Record<string, unknown> | null) ?? {}
  const nextIntake = {
    audience,
    search_stage: toNullableString(formData.get('search_stage')),
    transition_type: toNullableString(formData.get('transition_type')),
    urgency: toNullableString(formData.get('urgency')),
    target_companies: targetCompanies,
    company_size_stage: toNullableString(formData.get('company_size_stage')),
    geography: toNullableString(formData.get('intake_geography')),
    remote_travel: toNullableString(formData.get('remote_travel')),
    comp_guardrails: toNullableString(formData.get('comp_guardrails')),
    search_hypothesis: toNullableString(formData.get('search_hypothesis')),
    roles_to_avoid: rolesToAvoid,
    culture_criteria: toNullableString(formData.get('culture_criteria')),
    red_flags: redFlags,
    decision_criteria: decisionCriteria,
    board_visibility: toNullableString(formData.get('board_visibility')),
    stakeholder_complexity: toNullableString(formData.get('stakeholder_complexity')),
    relationship_targets: relationshipTargets,
    partner_notes: audience === 'partner' ? toNullableString(formData.get('partner_notes')) : null,
    coach_name: audience === 'partner' ? toNullableString(formData.get('coach_name')) : null,
  }

  const updatedRoleContext = {
    ...roleContext,
    search_intake: nextIntake,
  }

  // Optional fields must not clobber existing profile data when left blank:
  // this form prefills from user_profiles, so an empty submission means "unchanged", not "clear".
  // Identity fields (name, title, company) are owned by the profile page and never written here.
  const { error } = await supabase
    .from('user_profiles')
    .upsert(
      {
        user_id: user.id,
        target_titles: targetTitles,
        target_sectors: targetSectors,
        positioning_summary: positioningSummary,
        role_context: updatedRoleContext,
        ...(targetLocations.length > 0 ? { target_locations: targetLocations } : {}),
      },
      { onConflict: 'user_id' }
    )

  if (error) {
    redirect(`/dashboard/strategy/intake?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/strategy')
  revalidatePath('/dashboard/strategy/intake')
  redirect(`/dashboard/strategy/intake?saved=1&audience=${audience}`)
}