// Outcome labeling: records verified role openings and back-labels the
// preceding event window. This is the closed prediction loop — every opening
// we can verify becomes training signal for precursor calibration.

import { logger } from './logger.js'

export const LABEL_LOOKBACK_DAYS = 180
export const OPENING_DEDUP_WINDOW_DAYS = 14

const TECHNICAL_KEYWORDS = [
  'cto', 'cio', 'ciso', 'chief technology', 'chief information', 'chief data',
  'chief ai', 'chief security', 'chief information security', 'engineering',
  'technology', 'security', 'data', 'analytics', 'architect', 'infrastructure',
]
const DELIVERY_KEYWORDS = [
  'program', 'tpm', 'delivery', 'project management', 'pmo', 'operations engineering',
]
const LEADERSHIP_LEVEL = [
  'chief', 'vp', 'vice president', 'svp', 'evp', 'avp', 'president', 'coo',
  'ceo', 'cfo', 'cpo', 'cmo', 'chro', 'head of', 'director', 'general manager',
]

// Infers the role family for a title or appointment summary. Pure.
export function inferRoleFamilyFromTitle(text) {
  const lower = (text ?? '').toLowerCase()
  if (!lower) return 'leadership'
  if (DELIVERY_KEYWORDS.some(k => lower.includes(k))) return 'delivery_leadership'
  if (TECHNICAL_KEYWORDS.some(k => lower.includes(k))) return 'technical_leadership'
  return 'leadership'
}

// True when the text plausibly refers to a leadership-level role. Pure.
export function isLeadershipTitle(text) {
  const lower = (text ?? '').toLowerCase()
  return LEADERSHIP_LEVEL.some(k => lower.includes(k))
}

const ROLE_TYPE_TO_FAMILY = {
  cio: 'technical_leadership',
  cto: 'technical_leadership',
  ciso: 'technical_leadership',
  cdo_data: 'technical_leadership',
  vp_technology: 'technical_leadership',
  cdo_digital: 'leadership',
  cpo: 'leadership',
  coo: 'leadership',
}

// Maps a user profile role_type to a role family. Pure.
export function roleFamilyForRoleType(roleType) {
  return ROLE_TYPE_TO_FAMILY[roleType] ?? 'leadership'
}

function isoDateOffset(dateStr, days) {
  const date = new Date(`${dateStr}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export async function reconcileOpeningLabels(supabase, {
  openingId,
  canonicalCompanyId,
  openedOn,
  excludeEventId = null,
  excludeEventIds = [],
  excludeDeduplicatedExecHires = false,
}) {
  const { data: events, error: eventsError } = await supabase
    .from('company_events')
    .select('id, event_date, event_type')
    .eq('canonical_company_id', canonicalCompanyId)
    .gte('event_date', isoDateOffset(openedOn, -LABEL_LOOKBACK_DAYS))
    .lte('event_date', openedOn)
    .limit(500)

  if (eventsError) {
    logger.warn('outcome-labels: precursor fetch failed', { openingId, error: eventsError.message })
    return 0
  }

  const openedMs = new Date(`${openedOn}T00:00:00Z`).getTime()
  const excludedEventIds = new Set([excludeEventId, ...excludeEventIds].filter(Boolean))
  const labelRows = (events ?? [])
    .filter((event) => !excludedEventIds.has(event.id))
    .filter((event) => {
      if (!excludeDeduplicatedExecHires || event.event_type !== 'exec_hire') return true
      const eventMs = new Date(`${event.event_date}T00:00:00Z`).getTime()
      const distanceDays = Math.abs(openedMs - eventMs) / 86400000
      return distanceDays > OPENING_DEDUP_WINDOW_DAYS
    })
    .map((event) => ({
      event_id: event.id,
      opening_id: openingId,
      days_to_opening: Math.round(
        (openedMs - new Date(`${event.event_date}T00:00:00Z`).getTime()) / 86400000,
      ),
    }))

  if (labelRows.length === 0) return 0

  const eventIds = labelRows.map((row) => row.event_id)
  const { data: existingLabels, error: existingError } = await supabase
    .from('event_outcome_labels')
    .select('event_id')
    .eq('opening_id', openingId)
    .in('event_id', eventIds)

  if (existingError) {
    logger.warn('outcome-labels: existing-label fetch failed', { openingId, error: existingError.message })
    return 0
  }

  const existingEventIds = new Set((existingLabels ?? []).map((row) => row.event_id))
  const missingRows = labelRows.filter((row) => !existingEventIds.has(row.event_id))
  if (missingRows.length === 0) return 0

  const { error: labelError } = await supabase
    .from('event_outcome_labels')
    .upsert(missingRows, { onConflict: 'event_id,opening_id', ignoreDuplicates: true })

  if (labelError) {
    logger.warn('outcome-labels: back-label failed', { openingId, error: labelError.message })
    return 0
  }

  return missingRows.length
}

export async function reconcileExistingOpeningLabels(supabase, { limit = 1000 } = {}) {
  const { data: openings, error } = await supabase
    .from('role_openings')
    .select('id, canonical_company_id, opened_on, label_source, source_ref')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    logger.warn('outcome-labels: opening reconciliation fetch failed', { error: error.message })
    return { openingsChecked: 0, labeledEvents: 0 }
  }

  let labeledEvents = 0
  for (const opening of openings ?? []) {
    labeledEvents += await reconcileOpeningLabels(supabase, {
      openingId: opening.id,
      canonicalCompanyId: opening.canonical_company_id,
      openedOn: opening.opened_on,
      excludeEventId: opening.label_source === 'exec_hire' ? opening.source_ref : null,
      excludeDeduplicatedExecHires: opening.label_source === 'exec_hire',
    })
  }

  return { openingsChecked: openings?.length ?? 0, labeledEvents }
}

// Records a verified role opening (get-or-create with a dedup window) and
// back-labels every canonical event in the preceding LABEL_LOOKBACK_DAYS.
// Never throws; returns { openingId, labeledEvents, existing } or nulls.
export async function recordRoleOpening(supabase, {
  canonicalCompanyId,
  roleFamily,
  roleTitle = null,
  openedOn,
  labelSource,
  sourceRef = null,
  excludeFromPublicStats = false,
  excludeEventId = null,
}) {
  if (!canonicalCompanyId || !roleFamily || !openedOn || !labelSource) {
    return { openingId: null, labeledEvents: 0, existing: false }
  }

  try {
    // Dedup: same company + family + source within the window is one opening.
    const { data: existing } = await supabase
      .from('role_openings')
      .select('id, opened_on, label_source, source_ref')
      .eq('canonical_company_id', canonicalCompanyId)
      .eq('role_family', roleFamily)
      .eq('label_source', labelSource)
      .gte('opened_on', isoDateOffset(openedOn, -OPENING_DEDUP_WINDOW_DAYS))
      .lte('opened_on', isoDateOffset(openedOn, OPENING_DEDUP_WINDOW_DAYS))
      .limit(1)
      .maybeSingle()

    if (existing) {
      const labeledEvents = await reconcileOpeningLabels(supabase, {
        openingId: existing.id,
        canonicalCompanyId,
        openedOn: existing.opened_on,
        excludeEventId: existing.label_source === 'exec_hire' ? existing.source_ref : null,
        excludeEventIds: [excludeEventId],
        excludeDeduplicatedExecHires: existing.label_source === 'exec_hire',
      })
      return { openingId: existing.id, labeledEvents, existing: true }
    }

    const { data: opening, error: insertError } = await supabase
      .from('role_openings')
      .insert({
        canonical_company_id: canonicalCompanyId,
        role_family: roleFamily,
        role_title: roleTitle,
        opened_on: openedOn,
        label_source: labelSource,
        source_ref: sourceRef,
        exclude_from_public_stats: excludeFromPublicStats,
      })
      .select('id')
      .single()

    if (insertError || !opening) {
      logger.warn('outcome-labels: opening insert failed', { canonicalCompanyId, labelSource, error: insertError?.message })
      return { openingId: null, labeledEvents: 0, existing: false }
    }

    const labeledEvents = await reconcileOpeningLabels(supabase, {
      openingId: opening.id,
      canonicalCompanyId,
      openedOn,
      excludeEventId,
    })

    logger.info('outcome-labels: opening recorded', {
      canonicalCompanyId,
      labelSource,
      roleFamily,
      openedOn,
      labeledEvents,
    })
    return { openingId: opening.id, labeledEvents, existing: false }
  } catch (err) {
    logger.warn('outcome-labels: recordRoleOpening threw', { canonicalCompanyId, labelSource, error: err.message })
    return { openingId: null, labeledEvents: 0, existing: false }
  }
}
