export const ONBOARDING_CONTRACT_VERSION = 'onboarding-contract-v1-2026-07-06'

export const ONBOARDING_EVENT_NAMES = [
  'auth_callback_completed',
  'auth_callback_profile_lookup_failed',
  'briefing_viewed',
  'briefing_first_session_guided_viewed',
  'onboarding_started',
  'onboarding_step_completed',
  'onboarding_first_value_ready',
  'onboarding_completed',
] as const

export type OnboardingEventName = (typeof ONBOARDING_EVENT_NAMES)[number]

export type ContractPrimitiveType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'nullable-string'
  | 'nullable-number'
  | 'nullable-boolean'

export type ContractPropertySpec = {
  type: ContractPrimitiveType
}

export type OnboardingEventContract = {
  eventName: OnboardingEventName
  description: string
  requiredProperties: Record<string, ContractPropertySpec>
  optionalProperties?: Record<string, ContractPropertySpec>
}

export type OnboardingEventProperties = Record<string, unknown>

export type OnboardingEventRow = {
  user_id: string
  event_name: string
  created_at: string
  properties: OnboardingEventProperties | null | undefined
}

export type ContractIssueCode = 'unsupported_event' | 'missing_property' | 'type_mismatch'

export type ContractIssue = {
  code: ContractIssueCode
  severity: 'critical' | 'warning'
  event_name: string
  property_name?: string
  expected_type?: ContractPrimitiveType
  actual_type?: string
  message: string
}

export const ONBOARDING_EVENT_CONTRACTS: Record<OnboardingEventName, OnboardingEventContract> = {
  auth_callback_completed: {
    eventName: 'auth_callback_completed',
    description: 'Auth callback resolution for new or returning users.',
    requiredProperties: {
      redirect_path: { type: 'string' },
      explicit_next: { type: 'boolean' },
      requested_next_path: { type: 'nullable-string' },
      first_login_needs_onboarding: { type: 'boolean' },
      auth_method: { type: 'string' },
      new_user_window: { type: 'boolean' },
    },
  },
  auth_callback_profile_lookup_failed: {
    eventName: 'auth_callback_profile_lookup_failed',
    description: 'Profile lookup failed during auth callback resolution.',
    requiredProperties: {
      explicit_next: { type: 'boolean' },
      requested_next_path: { type: 'nullable-string' },
      fallback_redirect_path: { type: 'string' },
      auth_method: { type: 'string' },
    },
  },
  briefing_viewed: {
    eventName: 'briefing_viewed',
    description: 'Daily briefing view surfaced to a user.',
    requiredProperties: {
      signals: { type: 'number' },
      matches: { type: 'number' },
      due_today: { type: 'number' },
      total_companies: { type: 'number' },
    },
    optionalProperties: {
      first_session_guided_state: { type: 'boolean' },
    },
  },
  briefing_first_session_guided_viewed: {
    eventName: 'briefing_first_session_guided_viewed',
    description: 'First-session guided briefing wrapper shown to an eligible user.',
    requiredProperties: {
      total_companies: { type: 'number' },
      account_age_hours: { type: 'nullable-number' },
      rollout_percentage: { type: 'number' },
    },
  },
  onboarding_started: {
    eventName: 'onboarding_started',
    description: 'User started the onboarding wizard.',
    requiredProperties: {
      started_at: { type: 'string' },
      channel: { type: 'string' },
      mode: { type: 'string' },
      confidence_band: { type: 'nullable-string' },
      action_context: { type: 'string' },
    },
  },
  onboarding_step_completed: {
    eventName: 'onboarding_step_completed',
    description: 'User completed a single onboarding wizard step.',
    requiredProperties: {
      step: { type: 'number' },
      elapsed_seconds: { type: 'number' },
      low_energy_mode: { type: 'boolean' },
      channel: { type: 'string' },
      mode: { type: 'string' },
      confidence_band: { type: 'nullable-string' },
      action_context: { type: 'string' },
    },
  },
  onboarding_first_value_ready: {
    eventName: 'onboarding_first_value_ready',
    description: 'User reached the first-value moment in onboarding.',
    requiredProperties: {
      elapsed_seconds: { type: 'number' },
      under_ten_minutes: { type: 'boolean' },
      company_count: { type: 'number' },
      wedge_surface: { type: 'string' },
      transition_first: { type: 'boolean' },
      low_energy_mode: { type: 'boolean' },
      mode: { type: 'string' },
      confidence_band: { type: 'nullable-string' },
      action_context: { type: 'string' },
    },
  },
  onboarding_completed: {
    eventName: 'onboarding_completed',
    description: 'User completed onboarding and was persisted into the post-onboarding state.',
    requiredProperties: {
      search_path: { type: 'string' },
      search_persona: { type: 'string' },
      employment_status: { type: 'string' },
      company_count: { type: 'number' },
      onboarding_channel: { type: 'string' },
      onboarding_low_energy: { type: 'boolean' },
      onboarding_elapsed_seconds: { type: 'number' },
      onboarding_under_ten_minutes: { type: 'boolean' },
      transition_first: { type: 'boolean' },
      role_family: { type: 'string' },
      role_title: { type: 'string' },
      role_seniority: { type: 'string' },
      workflow_variant: { type: 'string' },
      manual_fields_baseline: { type: 'nullable-number' },
      manual_fields_required: { type: 'nullable-number' },
      manual_fields_reduction_rate: { type: 'nullable-number' },
    },
  },
}

export function isOnboardingEventName(eventName: string): eventName is OnboardingEventName {
  return eventName in ONBOARDING_EVENT_CONTRACTS
}

export function getOnboardingEventContract(eventName: string): OnboardingEventContract | null {
  return isOnboardingEventName(eventName) ? ONBOARDING_EVENT_CONTRACTS[eventName] : null
}

export function normalizeOnboardingEventProperties(properties: unknown): OnboardingEventProperties {
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
    return {}
  }
  return properties as OnboardingEventProperties
}

function actualTypeOf(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function matchesType(value: unknown, expectedType: ContractPrimitiveType): boolean {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string'
    case 'number':
      return typeof value === 'number' && Number.isFinite(value)
    case 'boolean':
      return typeof value === 'boolean'
    case 'nullable-string':
      return value === null || typeof value === 'string'
    case 'nullable-number':
      return value === null || (typeof value === 'number' && Number.isFinite(value))
    case 'nullable-boolean':
      return value === null || typeof value === 'boolean'
  }
}

export function validateOnboardingEventProperties(eventName: string, properties: unknown): ContractIssue[] {
  const contract = getOnboardingEventContract(eventName)
  if (!contract) {
    return [
      {
        code: 'unsupported_event',
        severity: 'critical',
        event_name: eventName,
        message: `Unsupported onboarding event: ${eventName}`,
      },
    ]
  }

  const normalized = normalizeOnboardingEventProperties(properties)
  const issues: ContractIssue[] = []

  for (const [propertyName, spec] of Object.entries(contract.requiredProperties)) {
    if (!(propertyName in normalized)) {
      issues.push({
        code: 'missing_property',
        severity: 'critical',
        event_name: eventName,
        property_name: propertyName,
        expected_type: spec.type,
        message: `Missing required property ${propertyName} on ${eventName}`,
      })
      continue
    }

    const value = normalized[propertyName]
    if (!matchesType(value, spec.type)) {
      issues.push({
        code: 'type_mismatch',
        severity: 'critical',
        event_name: eventName,
        property_name: propertyName,
        expected_type: spec.type,
        actual_type: actualTypeOf(value),
        message: `Property ${propertyName} on ${eventName} must be ${spec.type}`,
      })
    }
  }

  for (const [propertyName, spec] of Object.entries(contract.optionalProperties ?? {})) {
    if (!(propertyName in normalized)) continue

    const value = normalized[propertyName]
    if (!matchesType(value, spec.type)) {
      issues.push({
        code: 'type_mismatch',
        severity: 'critical',
        event_name: eventName,
        property_name: propertyName,
        expected_type: spec.type,
        actual_type: actualTypeOf(value),
        message: `Optional property ${propertyName} on ${eventName} must be ${spec.type}`,
      })
    }
  }

  return issues
}
