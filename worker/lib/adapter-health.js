// WS11-01 adapter kill switch: per-source health tracking with auto-disable
// on repeated failure, mirroring the relationship engine pilot's
// stop-condition/resume model. A disabled adapter is skipped by the
// orchestrator until a human reviews the cause and re-enables it.

import { notify } from './notify.js'
import { logger } from './logger.js'

const DISABLE_AFTER_CONSECUTIVE_FAILURES = 5

export async function isAdapterEnabled(supabase, source) {
  const { data } = await supabase
    .from('adapter_health')
    .select('enabled')
    .eq('source', source)
    .maybeSingle()
  // No row yet means the adapter has never run; default enabled.
  return data ? data.enabled : true
}

export async function recordAdapterSuccess(supabase, source) {
  const { data: existing } = await supabase
    .from('adapter_health')
    .select('enabled')
    .eq('source', source)
    .maybeSingle()

  await supabase
    .from('adapter_health')
    .upsert(
      { source, enabled: existing?.enabled ?? true, consecutive_failures: 0, last_success_at: new Date().toISOString() },
      { onConflict: 'source' }
    )
}

// Explicit human-reviewed resume operation for an auto-disabled adapter.
export async function reEnableAdapter(supabase, source) {
  await supabase
    .from('adapter_health')
    .upsert(
      {
        source,
        enabled: true,
        consecutive_failures: 0,
        disabled_at: null,
        disabled_reason: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'source' }
    )
}

// Records a failed adapter call. Auto-disables the adapter once consecutive
// failures cross the threshold, logs the reason, and alerts.
export async function recordAdapterFailure(supabase, source, errorClass) {
  const { data: existing } = await supabase
    .from('adapter_health')
    .select('consecutive_failures')
    .eq('source', source)
    .maybeSingle()

  const consecutiveFailures = (existing?.consecutive_failures ?? 0) + 1
  const shouldDisable = consecutiveFailures >= DISABLE_AFTER_CONSECUTIVE_FAILURES

  await supabase
    .from('adapter_health')
    .upsert(
      {
        source,
        enabled: !shouldDisable,
        consecutive_failures: consecutiveFailures,
        last_failure_at: new Date().toISOString(),
        ...(shouldDisable
          ? { disabled_at: new Date().toISOString(), disabled_reason: errorClass }
          : {}),
      },
      { onConflict: 'source' }
    )

  if (shouldDisable) {
    logger.error(`adapter-health: ${source} auto-disabled`, { event: 'adapter_disabled', source, errorClass, consecutiveFailures })
    await notify({
      subject: `Adapter auto-disabled: ${source}`,
      body: [
        `Source adapter "${source}" was auto-disabled after ${consecutiveFailures} consecutive failures.`,
        `Last error class: ${errorClass}`,
        `Time: ${new Date().toISOString()}`,
        'Review the cause and re-enable via adapter_health before the next watchlist run reads this source.',
      ].join('\n'),
    }).catch(() => {})
  }

  return { consecutiveFailures, disabled: shouldDisable }
}
