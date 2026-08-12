import { createAdminClient } from '@/lib/supabase/admin'
import type { PMFEventName } from '@/lib/pmf-event-taxonomy'

export type UserEventName =
  | 'auth_path_routed'
  | 'auth_callback_completed'
  | 'auth_callback_profile_lookup_failed'
  | 'resume_uploaded'
  | 'linkedin_imported'
  | 'company_added'
  | 'homepage_viewed'
  | 'homepage_dwell_10s'
  | 'homepage_dwell_30s'
  | 'homepage_cta_clicked'
  | 'first_mile_section_dwell'
  | 'dashboard_first_run_viewed'
  | 'prep_brief_generated'
  | 'strategy_brief_generated'
  | 'outreach_draft_generated'
  | 'contact_added'
  | 'briefing_configured'
  | 'follow_up_set'
  | 'pipeline_stage_changed'
  | 'brief_rated'
  | 'activation_complete'
  | 'activation_reached'
  | 'offer_accepted'
  | 'onboarding_completed'
  | 'onboarding_completion_write_failed'
  | 'positioning_saved'
  | 'signal_outreach_generated'
  | 'signals_scan_requested_on_demand'
  | 'signals_page_viewed'
  | 'briefing_viewed'
  | 'briefing_first_session_guided_viewed'
  | 'briefing_action_clicked'
  | 'search_paused'
  | 'search_resumed'
  | 'channel_entry_clicked'
  | 'persona_route_selected'
  | 'trust_block_viewed'
  | 'trust_block_interacted'
  | 'micro_product_boundary_viewed'
  | 'shortlist_sprint_viewed'
  | 'shortlist_sprint_cta_clicked'
  | 'shortlist_sprint_checkout_started'
  | 'shortlist_sprint_purchased'
  | 'shortlist_sprint_delivered'
  | 'shortlist_sprint_credit_applied'
  | 'partner_pilot_admin_viewed'
  | 'partner_pilot_seat_status_updated'
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_nudge_shown'
  | 'onboarding_low_energy_enabled'
  | 'onboarding_first_value_ready'
  | 'emi_assessment_started'
  | 'emi_assessment_completed'
  | 'emi_onboarding_started'
  | 'emi_daily_loop_loaded'
  | 'emi_action_completed'
  | 'emi_daily_reflection_submitted'
  | 'discover_recommendations_generated'
  | 'discover_run_created'
  | 'discover_recommendation_opened'
  | 'discover_recommendation_added'
  | 'discover_outreach_started'
  | 'relationship_recommendations_generated'
  | 'relationship_targeting_review_queued'
  | 'stall_state_detected'
  | 'outreach_review_required'
  | 'outreach_review_confirmed'
  | 'prep_brief_reviewed'
  | 'prep_outcome_logged'
  | PMFEventName

type EventProperties = Record<string, string | number | boolean | null>

type SourceContext = {
  signup_source: string | null
  referral_source: string | null
  acquisition_channel: string | null
}

async function readSourceContext(admin: ReturnType<typeof createAdminClient>, userId: string): Promise<SourceContext> {
  try {
    const { data } = await admin
      .from('users')
      .select('signup_source, referral_source, acquisition_channel')
      .eq('id', userId)
      .maybeSingle()

    return {
      signup_source: data?.signup_source ?? null,
      referral_source: data?.referral_source ?? null,
      acquisition_channel: data?.acquisition_channel ?? null,
    }
  } catch {
    return {
      signup_source: null,
      referral_source: null,
      acquisition_channel: null,
    }
  }
}

function withSourceContext(properties: EventProperties, source: SourceContext): EventProperties {
  return {
    ...((source.signup_source !== null && !('signup_source' in properties))
      ? { signup_source: source.signup_source }
      : {}),
    ...((source.referral_source !== null && !('referral_source' in properties))
      ? { referral_source: source.referral_source }
      : {}),
    ...((source.acquisition_channel !== null && !('acquisition_channel' in properties))
      ? { acquisition_channel: source.acquisition_channel }
      : {}),
    ...properties,
  }
}

/**
 * Log a user behavior event to the user_events table.
 * Uses the admin client (bypasses RLS) - server-side only.
 * Never throws: event logging must not break the calling flow.
 */
export async function logEvent(
  userId: string,
  eventName: UserEventName,
  properties: EventProperties = {}
): Promise<void> {
  try {
    const admin = createAdminClient()
    const sourceContext = await readSourceContext(admin, userId)
    await admin.from('user_events').insert({
      user_id: userId,
      event_name: eventName,
      properties: withSourceContext(properties, sourceContext),
    })
  } catch {
    // Intentionally silent - analytics must not interrupt product flows
  }
}

/**
 * Log a company watch event for aggregate market intelligence.
 * Called when a user adds a company to their pipeline.
 */
export async function logCompanyWatch(
  userId: string,
  companyId: string,
  opts: {
    sector: string | null
    careerPageUrlPresent: boolean
    fitScore: number | null
    stage: string
  }
): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('company_watch_events').insert({
      user_id: userId,
      company_id: companyId,
      sector: opts.sector,
      career_page_url_present: opts.careerPageUrlPresent,
      fit_score: opts.fitScore,
      stage: opts.stage,
    })
  } catch {
    // Intentionally silent
  }
}

/**
 * Mark offer accepted: sets offer_accepted_at on the users row.
 * Called when a company stage changes to 'offer'.
 */
export async function markOfferAccepted(userId: string): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin
      .from('users')
      .update({ offer_accepted_at: new Date().toISOString() })
      .eq('id', userId)
      .is('offer_accepted_at', null) // only set once
  } catch {
    // Intentionally silent
  }
}
