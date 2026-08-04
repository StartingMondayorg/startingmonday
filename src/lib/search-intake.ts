export type SearchIntake = {
  audience?: 'individual' | 'partner'
  search_stage?: string | null
  transition_type?: string | null
  urgency?: string | null
  target_companies?: string[] | null
  company_size_stage?: string | null
  geography?: string | null
  remote_travel?: string | null
  comp_guardrails?: string | null
  search_hypothesis?: string | null
  roles_to_avoid?: string[] | null
  culture_criteria?: string | null
  red_flags?: string[] | null
  decision_criteria?: string[] | null
  board_visibility?: string | null
  stakeholder_complexity?: string | null
  relationship_targets?: string[] | null
  partner_notes?: string | null
  coach_name?: string | null
}

// `label` renders inside a half-width <select> and must stay short enough not to
// truncate; `promptLabel` carries the fuller wording serialized into AI prompts.
export type IntakeOption = { value: string; label: string; promptLabel?: string }

export const TRANSITION_TYPE_OPTIONS: IntakeOption[] = [
  { value: 'confidential_search', label: 'Confidential search', promptLabel: 'Confidential search (employed, searching quietly)' },
  { value: 'active_search', label: 'Active search' },
  { value: 'post_transition', label: 'Between roles / exited', promptLabel: 'Post-transition (recently exited or between roles)' },
  { value: 'consulting_interim', label: 'Consulting / interim', promptLabel: 'Consulting or interim, seeking a permanent role' },
  { value: 'exploring', label: 'Exploring, not committed', promptLabel: 'Exploring, no committed search yet' },
]

export const SEARCH_STAGE_OPTIONS: IntakeOption[] = [
  { value: 'discovery', label: 'Discovery', promptLabel: 'Discovery (defining the search)' },
  { value: 'target_list', label: 'Building the target list' },
  { value: 'active_outreach', label: 'Active outreach', promptLabel: 'Active outreach and networking' },
  { value: 'interviewing', label: 'Active interviews' },
  { value: 'offer_stage', label: 'Offer stage' },
]

export const URGENCY_OPTIONS: IntakeOption[] = [
  { value: 'immediate', label: 'Immediate', promptLabel: 'Immediate (need something now)' },
  { value: 'within_3_months', label: 'Within 3 months' },
  { value: 'within_6_months', label: 'Within 6 months' },
  { value: 'right_opportunity', label: 'Right opportunity only' },
]

// Onboarding stores employment_status / search_timeline on user_profiles.
// These maps let the intake form default from onboarding answers (Option A journey).
const EMPLOYMENT_STATUS_TO_TRANSITION: Record<string, string> = {
  employed_exploring: 'confidential_search',
  active_search: 'active_search',
  consulting: 'consulting_interim',
  between_roles: 'post_transition',
}

const SEARCH_TIMELINE_TO_URGENCY: Record<string, string> = {
  immediately: 'immediate',
  '3_months': 'within_3_months',
  '6_months': 'within_6_months',
  opportunistic: 'right_opportunity',
}

export function transitionTypeFromEmploymentStatus(status?: string | null): string | null {
  return status ? EMPLOYMENT_STATUS_TO_TRANSITION[status] ?? null : null
}

export function urgencyFromSearchTimeline(timeline?: string | null): string | null {
  return timeline ? SEARCH_TIMELINE_TO_URGENCY[timeline] ?? null : null
}

// Legacy rows saved these as free text before the form used selects; fall back to the raw value.
export function intakeOptionLabel(options: IntakeOption[], value?: string | null): string | null {
  if (!value) return null
  const option = options.find(o => o.value === value)
  return option ? option.promptLabel ?? option.label : value
}

export function getSearchIntake(roleContext: unknown): SearchIntake | null {
  const intake = (roleContext as Record<string, unknown> | null | undefined)?.search_intake as SearchIntake | undefined
  return intake ?? null
}

export function buildSearchIntakeSection(roleContext: unknown): string {
  const intake = getSearchIntake(roleContext)
  if (!intake) return ''
  const line = (label: string, value?: string | null) => (value ? `\n${label}: ${value}` : '')
  const list = (label: string, values?: string[] | null) => (values?.length ? `\n${label}: ${values.join(', ')}` : '')
  const body =
    line('Transition type', intakeOptionLabel(TRANSITION_TYPE_OPTIONS, intake.transition_type)) +
    line('Search stage', intakeOptionLabel(SEARCH_STAGE_OPTIONS, intake.search_stage)) +
    line('Urgency / timing', intakeOptionLabel(URGENCY_OPTIONS, intake.urgency)) +
    line('Search hypothesis', intake.search_hypothesis) +
    list('Named target companies', intake.target_companies) +
    line('Company size / stage preference', intake.company_size_stage) +
    line('Geography', intake.geography) +
    line('Remote / travel constraints', intake.remote_travel) +
    line('Compensation guardrails', intake.comp_guardrails) +
    list('Roles to avoid', intake.roles_to_avoid) +
    line('Culture criteria', intake.culture_criteria) +
    list('Red flags', intake.red_flags) +
    list('Decision criteria', intake.decision_criteria) +
    line('Board visibility preference', intake.board_visibility) +
    line('Stakeholder complexity', intake.stakeholder_complexity) +
    list('Relationships to activate', intake.relationship_targets) +
    line('Coach / partner', intake.coach_name) +
    line('Coach notes', intake.partner_notes)
  if (!body) return ''
  return `\n\nSEARCH INTAKE (the candidate's stated decision rules. Honor roles to avoid, decision criteria, and red flags when assessing fit and recommending targets.)${body}`
}
