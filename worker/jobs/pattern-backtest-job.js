import { logger } from '../lib/logger.js'
import { getSupabase } from '../lib/supabase.js'
import { evaluatePatternTimeline, summarizePatternMetrics } from '../lib/pattern-replay-core.js'
import { PATTERN_LIBRARY, GENERIC_PATTERNS } from '../signals/correlate-signals.js'
import {
  MATCHING_POLICY_VERSION,
  assertExactControlCount,
  assertReplayBuildSupport,
  assertVersionPrefix,
} from '../lib/backtest-matching-dimensions.js'

const PATTERN_BACKTEST_LOCK_KEY = 2498317501n
const COHORT_LIMIT = Number(process.env.BACKTEST_COHORT_LIMIT ?? 300)
const COHORT_VERSION_PREFIX = process.env.BACKTEST_COHORT_VERSION ?? 'v2'

function uniqueByName(patterns) {
  const map = new Map()
  for (const pattern of patterns) {
    if (!pattern?.name || map.has(pattern.name)) continue
    map.set(pattern.name, pattern)
  }
  return [...map.values()]
}

function patternsForRoleFamily(roleFamily) {
  if (roleFamily === 'technical_leadership') {
    return uniqueByName([
      ...(PATTERN_LIBRARY.cio ?? []),
      ...(PATTERN_LIBRARY.cto ?? []),
      ...(PATTERN_LIBRARY.ciso ?? []),
      ...(PATTERN_LIBRARY.cdo_data ?? []),
      ...(PATTERN_LIBRARY.vp_technology ?? []),
    ])
  }

  if (roleFamily === 'delivery_leadership') {
    return uniqueByName([
      ...(PATTERN_LIBRARY.coo ?? []),
      ...(PATTERN_LIBRARY.cdo_digital ?? []),
    ])
  }

  return uniqueByName([
    ...(PATTERN_LIBRARY.coo ?? []),
    ...(PATTERN_LIBRARY.cpo ?? []),
    ...(PATTERN_LIBRARY.cdo_digital ?? []),
    ...GENERIC_PATTERNS,
  ])
}

function groupByCompany(events) {
  const grouped = new Map()
  for (const event of events ?? []) {
    const key = event.canonical_company_id
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(event)
  }
  return grouped
}

export async function runPatternBacktestJob() {
  assertVersionPrefix(COHORT_VERSION_PREFIX)
  const supabase = getSupabase()

  const { data: locked } = await supabase.rpc('try_advisory_lock', { p_key: PATTERN_BACKTEST_LOCK_KEY })
  if (!locked) {
    logger.warn('pattern-backtest-job: another instance running — skipping')
    return
  }

  let runId = null

  try {
    const { data: buildRun, error: buildRunError } = await supabase
      .from('backtest_cohort_build_runs')
      .select('id, cohort_version, scanned_opening_count, included_cohort_count, excluded_cohort_count, exclusion_reasons, controls_per_cohort, matching_policy_version')
      .like('cohort_version', `${COHORT_VERSION_PREFIX}-%`)
      .eq('status', 'complete')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (buildRunError) throw new Error(`cohort_build_run_fetch_failed:${buildRunError.message}`)
    assertReplayBuildSupport(buildRun, COHORT_LIMIT)
    const cohortVersion = buildRun.cohort_version

    const { data: run } = await supabase
      .from('backtest_replay_runs')
      .insert({
        cohort_version: cohortVersion,
        cohort_build_run_id: buildRun.id,
        candidate_cohort_count: buildRun.scanned_opening_count,
        excluded_cohort_count: buildRun.excluded_cohort_count,
        exclusion_reasons: buildRun.exclusion_reasons,
        controls_per_cohort: buildRun.controls_per_cohort,
        matching_policy_version: buildRun.matching_policy_version ?? MATCHING_POLICY_VERSION,
        status: 'running',
      })
      .select('id')
      .single()
    runId = run?.id ?? null

    const { data: cohorts, error: cohortError } = await supabase
      .from('backtest_cohorts')
      .select('id, canonical_company_id, role_family, opened_on, timeline_start, timeline_end, timeline, cohort_version')
      .eq('cohort_version', cohortVersion)
      .order('opened_on', { ascending: false })
      .limit(COHORT_LIMIT)

    if (cohortError) throw new Error(`cohort_fetch_failed:${cohortError.message}`)

    const metricRows = new Map()
    let controlCount = 0

    for (const cohort of cohorts ?? []) {
      const patterns = patternsForRoleFamily(cohort.role_family)
      const timeline = Array.isArray(cohort.timeline) ? cohort.timeline : []

      const { data: controlRows } = await supabase
        .from('backtest_controls')
        .select('canonical_company_id')
        .eq('cohort_id', cohort.id)

      const controlIds = (controlRows ?? []).map((row) => row.canonical_company_id)
      assertExactControlCount(cohort.id, controlIds.length, buildRun.controls_per_cohort)
      controlCount += controlIds.length

      let controlTimelines = new Map()
      if (controlIds.length) {
        const { data: controlEvents } = await supabase
          .from('company_events')
          .select('canonical_company_id, event_type, event_date, summary')
          .in('canonical_company_id', controlIds)
          .gte('event_date', cohort.timeline_start)
          .lte('event_date', cohort.opened_on)
          .limit(5000)
        controlTimelines = groupByCompany(controlEvents ?? [])
      }

      for (const pattern of patterns) {
        const key = `${pattern.name}::${cohort.role_family ?? 'leadership'}`
        if (!metricRows.has(key)) metricRows.set(key, [])

        const positive = evaluatePatternTimeline(pattern, timeline, cohort.opened_on)
        metricRows.get(key).push({
          actualPositive: true,
          predictedPositive: positive.detected,
          leadTimeDays: positive.detected ? positive.leadTimeDays : null,
        })

        for (const controlId of controlIds) {
          const controlTimeline = controlTimelines.get(controlId) ?? []
          const negative = evaluatePatternTimeline(pattern, controlTimeline, cohort.opened_on)
          metricRows.get(key).push({
            actualPositive: false,
            predictedPositive: negative.detected,
            leadTimeDays: null,
          })
        }
      }
    }

    for (const [key, rows] of metricRows.entries()) {
      const [patternName, roleFamily] = key.split('::')
      const metrics = summarizePatternMetrics(rows)

      await supabase.from('pattern_backtests').upsert(
        {
          run_id: runId,
          cohort_version: cohortVersion,
          pattern_name: patternName,
          role_family: roleFamily,
          support_n: metrics.support,
          true_positives: metrics.tp,
          false_positives: metrics.fp,
          false_negatives: metrics.fn,
          precision: Number(metrics.precision.toFixed(4)),
          recall: Number(metrics.recall.toFixed(4)),
          fp_rate: Number(metrics.fpRate.toFixed(4)),
          median_lead_time_days: metrics.medianLead,
          computed_at: new Date().toISOString(),
        },
        { onConflict: 'cohort_version,pattern_name,role_family' },
      )
    }

    if (runId) {
      await supabase
        .from('backtest_replay_runs')
        .update({
          status: 'complete',
          cohort_count: cohorts?.length ?? 0,
          control_count: controlCount,
          finished_at: new Date().toISOString(),
        })
        .eq('id', runId)
    }

    logger.info('pattern-backtest-job: complete', {
      runId,
      cohorts: cohorts?.length ?? 0,
      controls: controlCount,
      patterns: metricRows.size,
    })
  } catch (err) {
    if (runId) {
      await supabase
        .from('backtest_replay_runs')
        .update({ status: 'failed', error: err.message, finished_at: new Date().toISOString() })
        .eq('id', runId)
    }
    logger.error('pattern-backtest-job: failed', { error: err.message })
    throw err
  } finally {
    await supabase.rpc('advisory_unlock', { p_key: PATTERN_BACKTEST_LOCK_KEY })
  }
}
