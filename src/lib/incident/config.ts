import manifest from './alert-classes.json'

// The routing manifest lives under src/ rather than .github/ because the Slack
// receiver is its primary consumer and Next's build output does not reliably
// carry .github/. The responder workflow reads the same file from the checkout,
// so there is exactly one source of truth.

export type AlertMode = 'diagnose-and-patch' | 'diagnose-only' | 'notify-only'

export type ClassConfig = {
  mode: AlertMode
  why?: string
  min_consecutive?: number
  cooldown_minutes?: number
  max_daily_dispatches?: number
  require?: { not_all_failing?: boolean }
  runbook?: string
}

export type Suppression = {
  alert_class: string
  signal_key?: string
  fingerprint?: string
  until: string
  jira: string
  why?: string
}

const classes = manifest.classes as Record<string, ClassConfig>
const suppressions = manifest.suppressions as unknown as Suppression[]

/** Unknown classes are notify-only: a new alert shape can never auto-dispatch. */
export function classConfig(alertClass: string): ClassConfig {
  return classes[alertClass] ?? (manifest.default as ClassConfig)
}

export function globalDailyLimit(): number {
  return manifest.global.max_daily_dispatches
}

/**
 * A suppression needs both an owner and an expiry, so the list cannot silently
 * become a graveyard. An entry past its `until` date stops applying.
 */
export function findSuppression(
  alertClass: string,
  signalKey: string,
  fingerprintValue: string,
  now = new Date(),
): Suppression | null {
  return (
    suppressions.find(entry => {
      if (!entry.until || !entry.jira) return false
      if (new Date(entry.until) < now) return false
      if (entry.fingerprint) return entry.fingerprint === fingerprintValue
      if (entry.alert_class !== alertClass) return false
      return entry.signal_key ? entry.signal_key === signalKey : true
    }) ?? null
  )
}

export type DispatchDecision =
  | { dispatch: false; reason: string; mode: AlertMode }
  | { dispatch: true; mode: Exclude<AlertMode, 'notify-only'> }

/**
 * Everything except the budget, which has to be decided atomically in the
 * database. Kept pure so the storm and suppression rules are unit-testable.
 */
export function decideDispatch(input: {
  alertClass: string
  signalKey: string
  fingerprint: string
  occurrenceCount: number
  enabled: boolean
  allFailing?: boolean
  now?: Date
}): DispatchDecision {
  const config = classConfig(input.alertClass)

  if (!input.enabled) return { dispatch: false, reason: 'responder_disabled', mode: config.mode }
  if (config.mode === 'notify-only') return { dispatch: false, reason: 'class_notify_only', mode: config.mode }

  const suppression = findSuppression(input.alertClass, input.signalKey, input.fingerprint, input.now)
  if (suppression) {
    return { dispatch: false, reason: `suppressed_until_${suppression.until}`, mode: config.mode }
  }

  if (config.require?.not_all_failing && input.allFailing) {
    return { dispatch: false, reason: 'all_checks_failing_is_infra', mode: config.mode }
  }

  const needed = config.min_consecutive ?? 1
  if (input.occurrenceCount < needed) {
    return { dispatch: false, reason: `awaiting_consecutive_${input.occurrenceCount}_of_${needed}`, mode: config.mode }
  }

  // A fingerprint that has already been investigated does not get re-dispatched
  // by later deliveries of the same alert -- that is what kills the storm.
  if (input.occurrenceCount > needed) {
    return { dispatch: false, reason: 'already_dispatched_for_fingerprint', mode: config.mode }
  }

  return { dispatch: true, mode: config.mode }
}
