import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import type { SuggestedPerson } from '@/lib/enrichment'
import { logEvent } from '@/lib/events'
import { captureServerEvent } from '@/lib/posthog-server'
import { recommendOutreachRhythm, type OutreachStage } from '@/lib/outreach/outreach-rhythm'

type RecommendationRow = {
  id: string
  name: string
  sector: string
  metadata: Record<string, unknown> | null
  suggested_people: unknown
}

function resolveOutreachStage(metadata: Record<string, unknown> | null): OutreachStage {
  const stage = metadata
    && typeof metadata === 'object'
    && metadata.ranking
    && typeof metadata.ranking === 'object'
    && typeof (metadata.ranking as { stage?: unknown }).stage === 'string'
      ? ((metadata.ranking as { stage: string }).stage)
      : 'unknown'

  if (stage === 'watching' || stage === 'researching' || stage === 'applied' || stage === 'interviewing' || stage === 'offer') {
    return stage
  }
  return 'unknown'
}

function parseSuggestedPeople(value: unknown): SuggestedPerson[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const person = item as Partial<SuggestedPerson>
      if (typeof person.name !== 'string' || typeof person.title !== 'string') return null
      return {
        name: person.name,
        title: person.title,
        reason: typeof person.reason === 'string' ? person.reason : 'Recommended stakeholder for this company.',
        source: person.source === 'fallback' ? 'fallback' : 'anthropic',
        confidence: typeof person.confidence === 'number' ? Math.max(0.2, Math.min(0.99, person.confidence)) : 0.68,
      } satisfies SuggestedPerson
    })
    .filter((person): person is SuggestedPerson => Boolean(person))
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { id } = await params
  const supabase = await createClient()

  const body = await request.json().catch(() => ({})) as { mode?: 'contact' | 'outreach'; personIndex?: number }
  const mode = body.mode === 'outreach' ? 'outreach' : 'contact'
  const requestedPersonIndex = Number.isInteger(body.personIndex) ? Number(body.personIndex) : 0

  const { data: recommendation, error: recommendationError } = await (supabase as any)
    .from('company_recommendations')
    .select('id, name, sector, metadata, suggested_people')
    .eq('id', id)
    .eq('user_id', auth.userId)
    .single()

  if (recommendationError || !recommendation) {
    return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 })
  }

  const row = recommendation as RecommendationRow
  const people = parseSuggestedPeople(row.suggested_people)
  if (people.length === 0) {
    return NextResponse.json({ error: 'No suggested people are available to save yet.' }, { status: 400 })
  }

  const safePersonIndex = Math.max(0, Math.min(requestedPersonIndex, people.length - 1))
  const selectedPerson = people[safePersonIndex]
  const stage = resolveOutreachStage(row.metadata)
  const isWarmPath = selectedPerson.source !== 'fallback' && selectedPerson.confidence >= 0.8
  const cadence = recommendOutreachRhythm(stage, isWarmPath)
  const nextTouchIso = new Date(Date.now() + cadence.nextTouchDays * 86400_000).toISOString()

  const { data: matchingCompany } = await supabase
    .from('companies')
    .select('id, name')
    .eq('user_id', auth.userId)
    .is('archived_at', null)
    .ilike('name', row.name)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const existingQuery = supabase
    .from('contacts')
    .select('id, name, company_id, firm')
    .eq('user_id', auth.userId)
    .eq('status', 'active')
    .eq('name', selectedPerson.name)
    .order('updated_at', { ascending: false })
    .limit(1)

  const { data: existingContact } = matchingCompany
    ? await existingQuery.eq('company_id', matchingCompany.id).maybeSingle()
    : await existingQuery.ilike('firm', row.name).maybeSingle()

  let savedContactId: string | null = existingContact?.id ?? null

  if (savedContactId) {
    await supabase
      .from('contacts')
      .update({
        follow_up_at: nextTouchIso,
      })
      .eq('id', savedContactId)
      .eq('user_id', auth.userId)
  }

  if (!savedContactId) {
    const { data: inserted, error: insertError } = await supabase
      .from('contacts')
      .insert({
        user_id: auth.userId,
        company_id: matchingCompany?.id ?? null,
        name: selectedPerson.name,
        title: selectedPerson.title,
        firm: row.name,
        channel: 'cold',
        notes: `Added from discover recommendation. Reason: ${selectedPerson.reason}`,
        status: 'active',
        follow_up_at: nextTouchIso,
        enrichment_source: selectedPerson.source,
        enrichment_confidence: selectedPerson.confidence,
        enrichment_retention_expires_at: new Date(Date.now() + 30 * 86400_000).toISOString(),
      })
      .select('id')
      .single()

    if (insertError || !inserted) {
      return NextResponse.json({ error: 'Failed to save recommended contact.' }, { status: 500 })
    }

    savedContactId = inserted.id as string
  }

  const nowIso = new Date().toISOString()
  const currentMetadata = (row.metadata && typeof row.metadata === 'object') ? row.metadata : {}
  const mergedMetadata = {
    ...currentMetadata,
    staging: {
      status: 'saved',
      mode,
      savedAt: nowIso,
      selectedPersonIndex: safePersonIndex,
      savedContactId,
      deduped: Boolean(existingContact?.id),
      outreachCadence: {
        stage,
        warmPath: isWarmPath,
        nextTouchDays: cadence.nextTouchDays,
        rationale: cadence.rationale,
        nextTouchAt: nextTouchIso,
      },
    },
  }

  await (supabase as any)
    .from('company_recommendations')
    .update({ metadata: mergedMetadata })
    .eq('id', id)
    .eq('user_id', auth.userId)

  const eventProps = {
    recommendation_id: id,
    contact_id: savedContactId,
    contact_name: selectedPerson.name,
    mode,
    selected_person_index: safePersonIndex,
    deduped: Boolean(existingContact?.id),
    enrichment_source: selectedPerson.source,
  }

  await logEvent(auth.userId, 'discover_recommendation_added', eventProps)
  captureServerEvent(auth.userId, 'discover_recommendation_added', eventProps)

  if (mode === 'outreach') {
    await logEvent(auth.userId, 'discover_outreach_started', eventProps)
    captureServerEvent(auth.userId, 'discover_outreach_started', eventProps)
  }

  return NextResponse.json({
    ok: true,
    id: savedContactId,
    deduped: Boolean(existingContact?.id),
  })
}