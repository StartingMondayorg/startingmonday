'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingFormSchema } from '@/lib/schemas'
import { captureServerEvent } from '@/lib/posthog-server'
import { logEvent } from '@/lib/events'
import { computeElapsedSeconds, isTransitionFirstCohort, normalizeOnboardingChannel } from '@/lib/onboarding/onboarding-speed'
import { sendEmail } from '@/lib/email/email'
import { getNotifyEmails } from '@/lib/email/owner-email'
import { resolveRoleProfile } from '@/lib/role-taxonomy'
import { ONBOARDING_FINAL_STEP, type OnboardingDraft } from '@/lib/onboarding/onboarding-state'

function parseCsv(raw: string) {
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

export async function saveOnboardingProgress(currentStep: number, draft: OnboardingDraft) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Your session expired. Sign in again to continue.')
  if (!Number.isInteger(currentStep) || currentStep < 0 || currentStep > ONBOARDING_FINAL_STEP) {
    throw new Error('Invalid onboarding step')
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('onboarding_completed_at, onboarding_current_step')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error(JSON.stringify({ event: 'onboarding_progress_read_failed', userId: user.id, code: profileError.code }))
    throw new Error('We could not save your progress. Please try again.')
  }
  if (profile?.onboarding_completed_at) return

  const persistedStep = Math.max(profile?.onboarding_current_step ?? 0, currentStep)
  const { error } = await supabase.from('user_profiles').upsert(
    {
      user_id: user.id,
      onboarding_current_step: persistedStep,
      onboarding_draft: draft,
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    console.error(JSON.stringify({ event: 'onboarding_progress_write_failed', userId: user.id, code: error.code }))
    throw new Error('We could not save your progress. Please try again.')
  }
}

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const searchPersona       = (formData.get('search_persona') as string) || null
  const searchPosture       = (formData.get('search_posture') as string) || null
  const onboardingChannel   = normalizeOnboardingChannel((formData.get('onboarding_channel') as string) || null)
  const onboardingLowEnergy = (formData.get('onboarding_low_energy') as string) === 'true'
  const onboardingStartedAt = (formData.get('onboarding_started_at') as string ?? '').trim() || null
  const elapsedSecondsRaw   = Number(formData.get('onboarding_elapsed_seconds') as string ?? '0')
  const elapsedSeconds      = Number.isFinite(elapsedSecondsRaw) && elapsedSecondsRaw > 0
    ? Math.round(elapsedSecondsRaw)
    : computeElapsedSeconds(onboardingStartedAt)
  const manualFieldsBaseline = Number(formData.get('manual_fields_baseline') as string ?? '0')
  const manualFieldsRequired = Number(formData.get('manual_fields_required') as string ?? '0')
  const manualFieldsReductionRate = Number(formData.get('manual_fields_reduction_rate') as string ?? '0')
  const fullName            = (formData.get('full_name') as string ?? '').trim() || null
  const currentTitle        = (formData.get('current_title') as string ?? '').trim() || null
  const currentCompany      = (formData.get('current_company') as string ?? '').trim() || null
  const employmentStatus    = (formData.get('employment_status') as string) || null
  const searchTimeline      = (formData.get('search_timeline') as string) || null
  const searchDriver        = (formData.get('search_driver') as string ?? '').trim() || null
  const linkedinUrl         = (formData.get('linkedin_url') as string ?? '').trim() || null
  const targetTitles        = parseCsv(formData.get('target_titles') as string ?? '')
  const targetSectors       = parseCsv(formData.get('target_sectors') as string ?? '')
  const targetLocations     = parseCsv(formData.get('target_locations') as string ?? '')
  const targetComp          = parseCsv(formData.get('target_comp') as string ?? '')
  const positioningStyle    = parseCsv(formData.get('positioning_style') as string ?? '')
  const dreamCompanies      = (formData.get('dream_companies') as string ?? '').trim() || null
  const dreamJob            = (formData.get('dream_job') as string ?? '').trim() || null
  const positioningSummary  = (formData.get('positioning_summary') as string ?? '').trim() || null
  const resumeText          = (formData.get('resume_text') as string ?? '').trim() || null
  const beyondResume        = (formData.get('beyond_resume') as string ?? '').trim() || null
  const careerHistoryRaw    = (formData.get('career_history_json') as string ?? '').trim()
  let careerHistoryJson: unknown = null
  if (careerHistoryRaw) {
    try { careerHistoryJson = JSON.parse(careerHistoryRaw) } catch { /* ignore malformed */ }
  }

  const briefingTime        = (formData.get('briefing_time') as string ?? '').trim() || null
  const briefingFrequency   = (formData.get('briefing_frequency') as string ?? '').trim() || 'daily'
  const emailNudgesOptIn    = (formData.get('email_nudges_opt_in') as string) === 'true'
  const roleTracksRaw       = (formData.get('target_role_tracks') as string ?? '').trim()
  let targetRoleTracks: string[] = []
  if (roleTracksRaw) {
    try {
      const parsed = JSON.parse(roleTracksRaw)
      if (Array.isArray(parsed)) {
        targetRoleTracks = parsed
          .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
          .slice(0, 10)
      }
    } catch { /* ignore */ }
  }
  const companyNamesRaw     = (formData.get('company_names') as string ?? '').trim()
  let companyNamesList: string[] = []
  if (companyNamesRaw) {
    try {
      const parsed = JSON.parse(companyNamesRaw)
      if (Array.isArray(parsed)) companyNamesList = parsed.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).slice(0, 8)
    } catch { /* ignore */ }
  }

  const validation = OnboardingFormSchema.safeParse({ full_name: fullName, search_persona: searchPersona })
  if (!validation.success) {
    const msg = validation.error.issues[0]?.message ?? 'Required fields missing'
    redirect(`/onboarding?error=${encodeURIComponent(msg)}`)
  }

  if (resumeText && resumeText.length > 100_000) redirect('/onboarding?error=resume_too_long')

  const resolvedRole = resolveRoleProfile({
    roleFamily: (formData.get('role_family') as string) || null,
    roleTitle: (formData.get('role_title') as string) || null,
    currentTitle,
    targetTitles,
    searchPersona: (searchPersona as 'csuite' | 'vp' | 'director' | 'board' | null),
  })

  const searchPath =
    (employmentStatus === 'employed_exploring' && searchTimeline === 'opportunistic') ? 'watcher' :
    (employmentStatus === 'between_roles' && searchTimeline === 'immediately') ? 'nurture' :
    'campaign'
  const transitionFirst = isTransitionFirstCohort(employmentStatus, searchTimeline)
  const underTenMinutes = elapsedSeconds > 0 && elapsedSeconds <= 600

  const now = new Date().toISOString()
  const roleContext = {
    target_locations: targetLocations.length > 0 ? targetLocations : null,
    target_sectors: targetSectors.length > 0 ? targetSectors : null,
    target_comp: targetComp.length > 0 ? targetComp : null,
    positioning_style: positioningStyle.length > 0 ? positioningStyle : null,
  }

  const { error: profileProjectionError } = await supabase.from('user_profiles').upsert(
    {
      user_id:                  user.id,
      search_persona:           resolvedRole.searchPersonaLegacy,
      search_posture:           searchPosture,
      role_type:                resolvedRole.roleTypeLegacy,
      role_family:              resolvedRole.roleFamily,
      role_title:               resolvedRole.roleTitle,
      role_seniority:           resolvedRole.roleSeniority,
      workflow_variant:         resolvedRole.workflowVariant,
      target_role_tracks:       targetRoleTracks.length > 0 ? targetRoleTracks : null,
      full_name:                fullName,
      current_title:            currentTitle,
      current_company:          currentCompany,
      employment_status:        employmentStatus,
      search_timeline:          searchTimeline,
      search_driver:            searchDriver,
      search_path:              searchPath,
      linkedin_url:             linkedinUrl,
      role_context:             roleContext,
      target_titles:            targetTitles.length > 0 ? targetTitles : null,
      target_sectors:           targetSectors.length > 0 ? targetSectors : null,
      target_locations:         targetLocations.length > 0 ? targetLocations : null,
      dream_companies:          dreamCompanies,
      dream_job:                dreamJob,
      positioning_summary:      positioningSummary,
      resume_text:              resumeText,
      beyond_resume:            beyondResume,
      career_history_json:      careerHistoryJson,
      briefing_time:            briefingTime,
      briefing_frequency:       briefingFrequency,
    },
    { onConflict: 'user_id' }
  )

  if (profileProjectionError) {
    captureServerEvent(user.id, 'onboarding_completion_write_failed', {
      message: profileProjectionError.message,
      code: profileProjectionError.code ?? null,
      phase: 'profile_projection',
    })
    await logEvent(user.id, 'onboarding_completion_write_failed', {
      message: profileProjectionError.message,
      code: profileProjectionError.code ?? null,
      phase: 'profile_projection',
    })
    console.error(JSON.stringify({
      ts: new Date().toISOString(),
      event: 'onboarding_profile_projection_failed',
      user_id: user.id,
      message: profileProjectionError.message,
      code: profileProjectionError.code ?? null,
    }))
  }

  // .select() makes a zero-row match detectable: an UPDATE that matches no row
  // returns no error, which would otherwise report completion that never persisted (SMK-461).
  const { data: completionRows, error: completionUpdateError } = await supabase
    .from('user_profiles')
    .update({
      onboarding_completed_at: now,
      onboarding_current_step: ONBOARDING_FINAL_STEP,
      ...(profileProjectionError ? {} : { onboarding_draft: {} }),
    })
    .eq('user_id', user.id)
    .select('user_id')

  const completionError = completionUpdateError
    ?? (completionRows && completionRows.length > 0
      ? null
      : { message: 'completion update matched no user_profiles row', code: 'no_row_updated' })

  if (completionError) {
    captureServerEvent(user.id, 'onboarding_completion_write_failed', {
      message: completionError.message,
      code: completionError.code ?? null,
    })
    await logEvent(user.id, 'onboarding_completion_write_failed', {
      message: completionError.message,
      code: completionError.code ?? null,
    })
    console.error(JSON.stringify({
      ts: new Date().toISOString(),
      event: 'onboarding_completion_write_failed',
      user_id: user.id,
      message: completionError.message,
      code: completionError.code ?? null,
    }))
    redirect('/onboarding?error=' + encodeURIComponent('We could not save your setup. Your progress is still here. Please try again, and contact support@startingmonday.app if it keeps happening.'))
  }

  // Create basic company records from wizard. No career page URL yet; user adds those from the dashboard.
  if (companyNamesList.length > 0) {
    const rows = companyNamesList.map(name => ({
      user_id: user.id,
      name: name.trim(),
      stage: 'target',
    }))
    const { error: companyError } = await supabase.from('companies').upsert(rows, { onConflict: 'user_id,name', ignoreDuplicates: true })
    if (companyError) {
      console.error(JSON.stringify({ event: 'onboarding_company_projection_failed', userId: user.id, code: companyError.code }))
    }
  }

  // Set search_started_at only on first completion; don't overwrite if already set
  await supabase
    .from('user_profiles')
    .update({ search_started_at: now })
    .eq('user_id', user.id)
    .is('search_started_at', null)

  // Email nudges are opt-in (privacy-first): without explicit consent, trial drip emails stay off.
  // Daily briefings are unaffected - this only governs marketing-style nudge emails.
  await supabase
    .from('users')
    .update({ drip_unsubscribed_at: emailNudgesOptIn ? null : now })
    .eq('id', user.id)

  captureServerEvent(user.id, 'onboarding_completed', {
    search_path: searchPath,
    search_persona: searchPersona ?? '',
    employment_status: employmentStatus ?? '',
    company_count: companyNamesList.length,
    onboarding_channel: onboardingChannel,
    onboarding_low_energy: onboardingLowEnergy,
    onboarding_elapsed_seconds: elapsedSeconds,
    onboarding_under_ten_minutes: underTenMinutes,
    transition_first: transitionFirst,
    role_family: resolvedRole.roleFamily,
    role_title: resolvedRole.roleTitle,
    role_seniority: resolvedRole.roleSeniority,
    workflow_variant: resolvedRole.workflowVariant,
    manual_fields_baseline: Number.isFinite(manualFieldsBaseline) ? manualFieldsBaseline : null,
    manual_fields_required: Number.isFinite(manualFieldsRequired) ? manualFieldsRequired : null,
    manual_fields_reduction_rate: Number.isFinite(manualFieldsReductionRate) ? manualFieldsReductionRate : null,
  })
  await logEvent(user.id, 'onboarding_completed', {
    search_path: searchPath,
    search_persona: searchPersona ?? '',
    employment_status: employmentStatus ?? '',
    company_count: companyNamesList.length,
    onboarding_channel: onboardingChannel,
    onboarding_low_energy: onboardingLowEnergy,
    onboarding_elapsed_seconds: elapsedSeconds,
    onboarding_under_ten_minutes: underTenMinutes,
    transition_first: transitionFirst,
    role_family: resolvedRole.roleFamily,
    role_title: resolvedRole.roleTitle,
    role_seniority: resolvedRole.roleSeniority,
    workflow_variant: resolvedRole.workflowVariant,
    manual_fields_baseline: Number.isFinite(manualFieldsBaseline) ? manualFieldsBaseline : null,
    manual_fields_required: Number.isFinite(manualFieldsRequired) ? manualFieldsRequired : null,
    manual_fields_reduction_rate: Number.isFinite(manualFieldsReductionRate) ? manualFieldsReductionRate : null,
  })
  await logEvent(user.id, 'emi_assessment_completed', {
    search_path: searchPath,
    search_persona: searchPersona ?? '',
    employment_status: employmentStatus ?? '',
    company_count: companyNamesList.length,
    onboarding_channel: onboardingChannel,
    onboarding_low_energy: onboardingLowEnergy,
    onboarding_elapsed_seconds: elapsedSeconds,
    onboarding_under_ten_minutes: underTenMinutes,
    transition_first: transitionFirst,
    role_family: resolvedRole.roleFamily,
    role_title: resolvedRole.roleTitle,
    role_seniority: resolvedRole.roleSeniority,
    workflow_variant: resolvedRole.workflowVariant,
    manual_fields_baseline: Number.isFinite(manualFieldsBaseline) ? manualFieldsBaseline : null,
    manual_fields_required: Number.isFinite(manualFieldsRequired) ? manualFieldsRequired : null,
    manual_fields_reduction_rate: Number.isFinite(manualFieldsReductionRate) ? manualFieldsReductionRate : null,
  })

  const notifyEmails = getNotifyEmails()
  if (user.email && notifyEmails.length > 0) {
    const notifyNow = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    const isStaging = process.env.STAGING === 'true'
    const nameRow = fullName
      ? `<tr><td style="padding:4px 16px 4px 0;color:#64748b;">Name</td><td>${fullName}</td></tr>`
      : ''
    void sendEmail({
      to: notifyEmails.length === 1 ? notifyEmails[0] : notifyEmails,
      subject: isStaging ? 'New User Registered! - staging' : 'New User Registered!',
      bypassCouncil: true,
      html: `
        <p style="font-family:sans-serif;font-size:14px;color:#0f172a;margin:0 0 12px 0;">
          Heads up &#8212; another new user just registered.
        </p>
        <table style="font-family:sans-serif;font-size:13px;color:#334155;border-collapse:collapse;">
          <tr><td style="padding:4px 16px 4px 0;color:#64748b;">Email</td><td><strong>${user.email}</strong></td></tr>
          ${nameRow}
          <tr><td style="padding:4px 16px 4px 0;color:#64748b;">Plan</td><td>Free trial</td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#64748b;">Time</td><td>${notifyNow} CT</td></tr>
        </table>
      `,
    }).catch((error) => {
      console.error(JSON.stringify({
        ts: new Date().toISOString(),
        event: 'onboarding_notify_new_user_failed',
        email: user.email,
        message: error instanceof Error ? error.message : String(error),
      }))
    })
  }

  redirect('/dashboard/start')
}

export async function skipOnboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date().toISOString()

  const { error: skipWriteError } = await supabase.from('user_profiles').upsert(
    {
      user_id: user.id,
      onboarding_completed_at: now,
      onboarding_current_step: ONBOARDING_FINAL_STEP,
    },
    { onConflict: 'user_id' }
  )
  if (skipWriteError) {
    captureServerEvent(user.id, 'onboarding_completion_write_failed', {
      message: skipWriteError.message,
      code: skipWriteError.code ?? null,
      path: 'skip',
    })
    await logEvent(user.id, 'onboarding_completion_write_failed', {
      message: skipWriteError.message,
      code: skipWriteError.code ?? null,
      path: 'skip',
    })
    redirect('/onboarding?error=' + encodeURIComponent('We could not save your setup. Please try again, and contact support@startingmonday.app if it keeps happening.'))
  }

  await supabase
    .from('user_profiles')
    .update({ search_started_at: now })
    .eq('user_id', user.id)
    .is('search_started_at', null)

  redirect('/dashboard/start')
}
