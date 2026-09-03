'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logEvent } from '@/lib/events'
import { captureServerEvent } from '@/lib/posthog-server'

export async function saveQuickProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const fullName         = (formData.get('full_name')          as string ?? '').trim() || null
  const currentTitle     = (formData.get('current_title')      as string ?? '').trim() || null
  const positioningSummary = (formData.get('positioning_summary') as string ?? '').trim() || null

  await supabase
    .from('user_profiles')
    .upsert({ user_id: user.id, full_name: fullName, current_title: currentTitle, positioning_summary: positioningSummary }, { onConflict: 'user_id' })

  revalidatePath('/dashboard')
  redirect('/dashboard?profile_saved=1')
}

export async function deleteNotes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('user_profiles')
    .update({
      positioning_summary: null,
      beyond_resume: null,
      career_history_json: null,
      role_context: null,
    })
    .eq('user_id', user.id)

  revalidatePath('/dashboard/profile')
  redirect('/dashboard/profile?saved=1')
}

export async function saveProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const searchPersona = (['csuite', 'vp', 'director', 'board'] as const).find(v => v === formData.get('search_persona')) ?? null
  const validRoleTypes = ['cio', 'cto', 'cdo_data', 'cdo_digital', 'ciso', 'cpo', 'coo', 'vp_technology', 'other_csuite'] as const
  const roleType = validRoleTypes.find(v => v === formData.get('role_type')) ?? null
  const fullName      = (formData.get('full_name')      as string ?? '').trim() || null
  const currentTitle  = (formData.get('current_title')  as string ?? '').trim() || null
  const currentCompany = (formData.get('current_company') as string ?? '').trim() || null
  const searchPosture = (['active', 'exploring', 'not_looking'] as const).find(
    (value) => value === formData.get('search_posture'),
  ) ?? null
  const briefingTime  = (formData.get('briefing_time')  as string) || null
  const briefingDays  = formData.getAll('briefing_days') as string[]

  const parseCsv = (raw: string) =>
    raw.split(',').map(s => s.trim()).filter(Boolean)

  const targetTitles    = parseCsv(formData.get('target_titles')    as string ?? '')
  const targetSectors   = parseCsv(formData.get('target_sectors')   as string ?? '')
  const targetLocations = parseCsv(formData.get('target_locations') as string ?? '')
  const positioningSummary = (formData.get('positioning_summary') as string ?? '').trim() || null
  const resumeText = (formData.get('resume_text') as string ?? '').trim() || null
  const beyondResume = (formData.get('beyond_resume') as string ?? '').trim() || null
  const linkedinUrl = (formData.get('linkedin_url') as string ?? '').trim() || null
  const briefingEmail = (formData.get('briefing_email') as string ?? '').trim() || null
  const careerHistoryRaw = (formData.get('career_history_json') as string ?? '').trim()
  let careerHistoryJson: unknown = null
  if (careerHistoryRaw) {
    try { careerHistoryJson = JSON.parse(careerHistoryRaw) } catch { /* ignore malformed */ }
  }

  const starStoriesRaw = (formData.get('star_stories_json') as string ?? '').trim()
  let starStoriesJson: unknown = null
  if (starStoriesRaw) {
    try { starStoriesJson = JSON.parse(starStoriesRaw) } catch { /* ignore malformed */ }
  }

  const roleCtx: Record<string, unknown> = {}
  if (roleType === 'ciso') {
    const sf = parseCsv(formData.get('security_frameworks') as string ?? '')
    if (sf.length > 0) roleCtx.security_frameworks = sf
    const bsm = (formData.get('board_security_maturity') as string ?? '').trim()
    if (bsm) roleCtx.board_security_maturity = bsm
  }
  if (roleType === 'cpo') {
    const pte = (formData.get('product_type_exp') as string ?? '').trim()
    if (pte) roleCtx.product_type_exp = pte
    const pa = (formData.get('product_achievement') as string ?? '').trim()
    if (pa) roleCtx.product_achievement = pa
    const pm = (formData.get('product_metric') as string ?? '').trim()
    if (pm) roleCtx.product_metric = pm
  }
  if (roleType === 'coo') {
    const mt = formData.getAll('coo_mandate_types') as string[]
    if (mt.length > 0) roleCtx.coo_mandate_types = mt
    const cp = (formData.get('coo_ceo_partnership') as string ?? '').trim()
    if (cp) roleCtx.coo_ceo_partnership = cp
  }
  if (roleType === 'cto') {
    const tf = formData.getAll('cto_technical_flavor') as string[]
    if (tf.length > 0) roleCtx.cto_technical_flavor = tf
    const ad = (formData.get('cto_architecture_decision') as string ?? '').trim()
    if (ad) roleCtx.cto_architecture_decision = ad
  }
  if (roleType === 'cdo_data') {
    const dmo = (formData.get('data_maturity_orientation') as string ?? '').trim()
    if (dmo) roleCtx.data_maturity_orientation = dmo
    const dpb = (formData.get('data_platform_built') as string ?? '').trim()
    if (dpb) roleCtx.data_platform_built = dpb
  }
  if (roleType === 'cdo_digital') {
    const dbt = (formData.get('digital_background_type') as string ?? '').trim()
    if (dbt) roleCtx.digital_background_type = dbt
    const dtd = (formData.get('digital_transformation_delivered') as string ?? '').trim()
    if (dtd) roleCtx.digital_transformation_delivered = dtd
  }

  const { error: upsertError } = await supabase
    .from('user_profiles')
    .upsert(
      {
        user_id: user.id,
        full_name: fullName,
        current_title: currentTitle,
        current_company: currentCompany,
        search_posture: searchPosture,
        briefing_time: briefingTime,
        briefing_days: briefingDays.length > 0 ? briefingDays : null,
        briefing_email: briefingEmail,
        target_titles:    targetTitles.length    > 0 ? targetTitles    : null,
        target_sectors:   targetSectors.length   > 0 ? targetSectors   : null,
        target_locations: targetLocations.length > 0 ? targetLocations : null,
        positioning_summary: positioningSummary,
        resume_text: resumeText,
        beyond_resume: beyondResume,
        linkedin_url: linkedinUrl,
        search_persona: searchPersona,
        role_type: roleType,
        career_history_json: careerHistoryJson,
        role_context: Object.keys(roleCtx).length > 0 ? roleCtx : null,
        star_stories: starStoriesJson ?? [],
      },
      { onConflict: 'user_id' }
    )

  if (upsertError) {
    const details = { code: upsertError.code ?? null, phase: 'profile_upsert' }
    captureServerEvent(user.id, 'profile_save_failed', details)
    console.error(JSON.stringify({ event: 'profile_save_failed', userId: user.id, ...details }))
    redirect('/dashboard/profile?error=profile_save_failed')
    return
  }

  // Snapshot positioning to narrative_versions if it changed
  if (positioningSummary) {
    const { data: lastVersion } = await supabase
      .from('narrative_versions')
      .select('positioning')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (lastVersion?.positioning !== positioningSummary) {
      await supabase.from('narrative_versions').insert({ user_id: user.id, positioning: positioningSummary })
    }
  }

  if (resumeText) {
    await logEvent(user.id, 'resume_uploaded', {})
    captureServerEvent(user.id, 'resume_uploaded', {})
  }

  if (briefingTime) {
    await logEvent(user.id, 'briefing_configured', { briefing_time: briefingTime })
    captureServerEvent(user.id, 'briefing_configured', { briefing_time: briefingTime })
  }

  revalidatePath('/dashboard')
  redirect('/dashboard/profile?saved=1')
}

export async function dismissStallNudge() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('user_profiles')
    .update({ stall_nudge_dismissed_at: new Date().toISOString() })
    .eq('user_id', user.id)
  revalidatePath('/dashboard')
}

export async function saveWeeklyGoal(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const raw = parseInt(formData.get('weekly_goal') as string ?? '', 10)
  const goal = Number.isFinite(raw) && raw >= 1 && raw <= 10 ? raw : null
  if (!goal) return
  await supabase.from('user_profiles').update({ weekly_goal: goal }).eq('user_id', user.id)
  revalidatePath('/dashboard')
}
