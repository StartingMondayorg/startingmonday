import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { isRateLimited } from '@/lib/api-usage'
import { getUserSubscription, canAccessFeature } from '@/lib/billing/subscription'
import { anthropic, MODELS } from '@/lib/ai/anthropic'
import { recordTrace, recordTraceError } from '@/lib/trace'
import { getEnrichmentProvider, type SuggestedPerson } from '@/lib/enrichment'
import { logEvent } from '@/lib/events'
import { captureServerEvent } from '@/lib/posthog-server'

export type DiscoveryCompany = {
  id?: string
  narrativeUrl?: string
  name: string
  sector: string
  why: string
  fit: number
  signalFreshnessScore?: number
  provenanceCoverage?: number
  keySignals?: string[]
  keyAttributes?: string[]
  suggestedPeople?: SuggestedPerson[]
}

type RawDiscoveryCompany = {
  name?: unknown
  sector?: unknown
  why?: unknown
  fit?: unknown
  keySignals?: unknown
  keyAttributes?: unknown
  suggestedPeople?: unknown
}

const ROLE_ALIAS_MAP: Record<string, string[]> = {
  cio: ['cio', 'chief information officer'],
  'chief information officer': ['chief information officer', 'cio'],
  cto: ['cto', 'chief technology officer'],
  'chief technology officer': ['chief technology officer', 'cto'],
  ciso: ['ciso', 'chief information security officer'],
  'chief information security officer': ['chief information security officer', 'ciso'],
  coo: ['coo', 'chief operating officer'],
  'chief operating officer': ['chief operating officer', 'coo'],
  cdo: ['cdo', 'chief data officer', 'chief digital officer'],
  'chief data officer': ['chief data officer', 'cdo'],
  'chief digital officer': ['chief digital officer', 'cdo'],
  chro: ['chro', 'chief human resources officer'],
  'chief human resources officer': ['chief human resources officer', 'chro'],
  cpo: ['cpo', 'chief product officer'],
  'chief product officer': ['chief product officer', 'cpo'],
}

const REQUESTED_COUNT = 20
const RESPONSE_COUNT = 12

type RankedCandidate = DiscoveryCompany & {
  rankingScore: number
  rankingBreakdown: {
    fit: number
    peopleCoverage: number
    signalDepth: number
    attributeDepth: number
  }
}

function computeSignalFreshnessScore(fit: number, signalCount: number): number {
  const fitComponent = Math.max(0, Math.min(1, fit / 10))
  const signalComponent = Math.max(0, Math.min(1, signalCount / 4))
  return Math.round((fitComponent * 0.6 + signalComponent * 0.4) * 100)
}

function computeProvenanceCoverage(suggestedPeople: SuggestedPerson[]): number {
  const maxPeople = 3
  const peopleCoverage = Math.max(0, Math.min(1, suggestedPeople.length / maxPeople))
  const sourcedCoverage = suggestedPeople.length === 0
    ? 0
    : suggestedPeople.filter((person) => person.source !== 'fallback').length / suggestedPeople.length
  return Math.round((peopleCoverage * 0.5 + sourcedCoverage * 0.5) * 100)
}

function withMoatIndicators(candidate: DiscoveryCompany): DiscoveryCompany {
  const keySignals = candidate.keySignals ?? []
  const suggestedPeople = candidate.suggestedPeople ?? []
  return {
    ...candidate,
    keySignals,
    suggestedPeople,
    signalFreshnessScore: computeSignalFreshnessScore(candidate.fit, keySignals.length),
    provenanceCoverage: computeProvenanceCoverage(suggestedPeople),
  }
}

function clampFit(value: number): number {
  if (!Number.isFinite(value)) return 6
  return Math.max(1, Math.min(10, Math.round(value)))
}

function normalizeList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback
  const next = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4)
  return next.length > 0 ? next : fallback
}

function normalizeRoleText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseTargetRoleAliases(targetTitles: string): string[] {
  const baseRoles = targetTitles
    .split(/[\/,|]/)
    .map((role) => normalizeRoleText(role))
    .filter((role) => role.length >= 2)

  const aliases = new Set<string>()
  for (const role of baseRoles) {
    aliases.add(role)
    const mapped = ROLE_ALIAS_MAP[role] ?? []
    for (const alias of mapped) {
      const normalizedAlias = normalizeRoleText(alias)
      if (normalizedAlias.length >= 2) aliases.add(normalizedAlias)
    }
  }
  return [...aliases]
}

function titleContainsRole(title: string, roleAlias: string): boolean {
  const normalizedTitle = normalizeRoleText(title)
  if (!normalizedTitle || !roleAlias) return false

  if (roleAlias.length <= 5) {
    const escaped = roleAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`\\b${escaped}\\b`, 'i').test(normalizedTitle)
  }

  return normalizedTitle.includes(roleAlias)
}

export function shouldExcludeSuggestedPerson(title: string, targetTitles: string): boolean {
  const aliases = parseTargetRoleAliases(targetTitles)
  return aliases.some((alias) => titleContainsRole(title, alias))
}

function normalizePeople(value: unknown, targetTitles: string): SuggestedPerson[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const candidate = item as { name?: unknown; title?: unknown; reason?: unknown; source?: unknown; confidence?: unknown }
      if (typeof candidate.name !== 'string' || typeof candidate.title !== 'string') return null
      const source = candidate.source === 'fallback' ? 'fallback' : 'anthropic'
      const confidence = typeof candidate.confidence === 'number'
        ? Math.max(0.2, Math.min(0.99, candidate.confidence))
        : 0.68
      return {
        name: candidate.name.trim(),
        title: candidate.title.trim(),
        reason: typeof candidate.reason === 'string' && candidate.reason.trim().length > 0
          ? candidate.reason.trim()
          : 'Likely high-leverage stakeholder based on role and company context.',
        source,
        confidence,
      } satisfies SuggestedPerson
    })
    .filter((person): person is SuggestedPerson => Boolean(person))
    .filter((person) => !shouldExcludeSuggestedPerson(person.title, targetTitles))
    .slice(0, 3)
}

function normalizeCandidate(raw: RawDiscoveryCompany, targetTitles: string): DiscoveryCompany | null {
  if (typeof raw.name !== 'string' || typeof raw.sector !== 'string' || typeof raw.why !== 'string') {
    return null
  }

  const fit = typeof raw.fit === 'number' ? raw.fit : Number(raw.fit)
  return {
    name: raw.name.trim(),
    sector: raw.sector.trim(),
    why: raw.why.trim(),
    fit: clampFit(fit),
    keySignals: normalizeList(raw.keySignals, ['Recent leadership-relevant growth signal']),
    keyAttributes: normalizeList(raw.keyAttributes, ['Role scope likely aligned to senior operator profile']),
    suggestedPeople: normalizePeople(raw.suggestedPeople, targetTitles),
  }
}

function scoreCandidate(candidate: DiscoveryCompany): RankedCandidate {
  const fit = Math.max(0, Math.min(1, candidate.fit / 10))
  const peopleCoverage = Math.max(0, Math.min(1, (candidate.suggestedPeople?.length ?? 0) / 3))
  const signalDepth = Math.max(0, Math.min(1, (candidate.keySignals?.length ?? 0) / 4))
  const attributeDepth = Math.max(0, Math.min(1, (candidate.keyAttributes?.length ?? 0) / 4))

  // Deterministic ranking components: fit remains dominant while depth and outreach
  // coverage improve ordering among similarly scored companies.
  const rankingScore = Number((fit * 0.65 + peopleCoverage * 0.15 + signalDepth * 0.1 + attributeDepth * 0.1).toFixed(4))

  return {
    ...candidate,
    rankingScore,
    rankingBreakdown: {
      fit,
      peopleCoverage,
      signalDepth,
      attributeDepth,
    },
  }
}

function applyDiversityGuardrails(candidates: RankedCandidate[], count: number): RankedCandidate[] {
  const sectorCap = count <= RESPONSE_COUNT ? 3 : 5
  const byScore = [...candidates].sort((a, b) => {
    if (b.rankingScore !== a.rankingScore) return b.rankingScore - a.rankingScore
    if (b.fit !== a.fit) return b.fit - a.fit
    return a.name.localeCompare(b.name)
  })

  const sectorCounts = new Map<string, number>()
  const selected: RankedCandidate[] = []
  const overflow: RankedCandidate[] = []

  for (const candidate of byScore) {
    if (selected.length >= count) break
    const key = candidate.sector.trim().toLowerCase() || 'general'
    const current = sectorCounts.get(key) ?? 0
    if (current < sectorCap) {
      selected.push(candidate)
      sectorCounts.set(key, current + 1)
    } else {
      overflow.push(candidate)
    }
  }

  if (selected.length < count) {
    for (const candidate of overflow) {
      if (selected.length >= count) break
      selected.push(candidate)
    }
  }

  return selected
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { userId } = auth
  const supabase = await createClient()

  const sub = await getUserSubscription(userId, supabase)
  if (!canAccessFeature(sub, 'scan')) {
    return NextResponse.json({ error: 'upgrade_required' }, { status: 403 })
  }

  if (await isRateLimited(supabase, userId)) {
    return NextResponse.json({ error: 'Monthly limit reached.' }, { status: 429 })
  }

  let seeds: string[] = []
  let inlineContext: { currentTitle?: string; persona?: string; targetTitles?: string[] } = {}
  try {
    const body = await request.json()
    if (Array.isArray(body.seeds)) {
      seeds = body.seeds
        .filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
        .slice(0, 5)
    }
    if (body.context && typeof body.context === 'object') {
      inlineContext = body.context
    }
  } catch { /* no body */ }

  const [{ data: profile }, { data: existing }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('current_title, target_titles, target_sectors, positioning_summary, search_persona')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('companies')
      .select('name')
      .eq('user_id', userId)
      .is('archived_at', null),
  ])

  const existingNames = (existing ?? []).map(c => c.name.toLowerCase())

  // Prefer inline context (from onboarding wizard) over DB profile
  const targetTitles =
    inlineContext.targetTitles?.join(', ') ||
    inlineContext.currentTitle ||
    (Array.isArray(profile?.target_titles) && profile.target_titles.length > 0
      ? profile.target_titles.join(', ')
      : profile?.current_title ?? 'senior technology executive')

  const persona = inlineContext.persona || profile?.search_persona || ''
  const sectors = Array.isArray(profile?.target_sectors) && profile.target_sectors.length > 0
    ? `\nTarget sectors: ${profile.target_sectors.join(', ')}`
    : ''
  const positioning = profile?.positioning_summary
    ? `\nBackground: ${profile.positioning_summary.slice(0, 250)}`
    : ''

  const exclusionNote = existingNames.length > 0
    ? `\n\nExclude these (already in their pipeline): ${existingNames.join(', ')}.`
    : ''

  const seedNote = seeds.length > 0
    ? `\n\nFind companies similar to: ${seeds.join(', ')}. Weight toward organizations similar in type, size, stage, or sector.`
    : ''

  const personaNote = persona === 'csuite'
    ? 'They are targeting C-suite roles (CIO, CTO, COO, CHRO).'
    : persona === 'vp'
    ? 'They are targeting VP/SVP roles, potentially moving to C-suite.'
    : persona === 'board'
    ? 'They are targeting board seats or advisory roles.'
    : ''

  const prompt = `You are helping a senior executive build their job search target list. Suggest ${REQUESTED_COUNT} companies they should watch.

CANDIDATE
Titles/targets: ${targetTitles}${personaNote ? `\n${personaNote}` : ''}${sectors}${positioning}${seedNote}${exclusionNote}

Return a JSON array of exactly ${REQUESTED_COUNT} objects:
[
  {
    "name": "Company Name",
    "sector": "Short sector label (e.g. Enterprise Software, Healthcare, Financial Services)",
    "why": "One specific sentence: why this company is a strong fit for this candidate at this level right now. Reference something real and current about the company.",
    "fit": 8,
    "keySignals": ["2-4 concise signals indicating why now"],
    "keyAttributes": ["2-4 concise attributes that match this candidate"],
    "suggestedPeople": [
      {
        "name": "Person name",
        "title": "Most relevant title",
        "reason": "Why this person is useful for outreach",
        "source": "anthropic",
        "confidence": 0.71
      }
    ]
  }
]

Rules:
- fit: integer 1-10, 10 = perfect match for this candidate
- why: be specific. Name what the company is navigating, what makes it a fit, what the role might be. Not generic ("great culture", "growing company").
- Mix sizes: well-known companies and under-the-radar organizations
- Include companies plausibly hiring at this level in the next 12-18 months
- keySignals and keyAttributes: arrays with 2-4 concise bullets each
- suggestedPeople: 1-3 people, prefer role placeholders if a specific name is uncertain
- Never suggest people currently in the exact target role (example: if targeting CIO, do not suggest current CIOs)
- Sort by fit descending
- Return only the JSON array, no explanation, no markdown fences`

  try {
    const model = MODELS.sonnet
    const startMs = Date.now()
    const message = await anthropic.messages.create({
      model,
      max_tokens: 1800,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]'
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(cleaned) as unknown
    const parsedList = Array.isArray(parsed) ? parsed : []
    const normalized = parsedList
      .map((item) => normalizeCandidate((item ?? {}) as RawDiscoveryCompany, targetTitles))
      .filter((item): item is DiscoveryCompany => Boolean(item))

    const seen = new Set(normalized.map((item) => item.name.toLowerCase()))
    if (normalized.length < RESPONSE_COUNT) {
      const needed = RESPONSE_COUNT - normalized.length
      const { data: fallbackRows } = await supabase
        .from('reference_companies')
        .select('name, industries')
        .limit(needed * 4)

      for (const row of ((fallbackRows ?? []) as Array<{ name: string | null; industries: string[] | null }>)) {
        const fallbackName = (row.name ?? '').trim()
        if (!fallbackName) continue
        const lowered = fallbackName.toLowerCase()
        if (seen.has(lowered) || existingNames.includes(lowered)) continue
        seen.add(lowered)
        normalized.push({
          name: fallbackName,
          sector: row.industries?.[0] ?? 'General',
          why: 'Included as a reference-company fallback to maintain a robust recommendation set.',
          fit: 6,
          keySignals: ['Reference catalog presence indicates market relevance'],
          keyAttributes: ['Fallback recommendation pending deeper personalization'],
          suggestedPeople: [],
        })
        if (normalized.length >= RESPONSE_COUNT) break
      }
    }

    const provider = getEnrichmentProvider()
    const withEnrichment = await Promise.all(
      normalized.slice(0, REQUESTED_COUNT).map(async (candidate) => {
        const filteredExisting = (candidate.suggestedPeople ?? [])
          .filter((person) => !shouldExcludeSuggestedPerson(person.title, targetTitles))
          .slice(0, 3)
        if (filteredExisting.length >= 1) {
          return {
            ...candidate,
            suggestedPeople: filteredExisting,
          }
        }

        const enrichedPeople = await provider.enrichPeople({
          companyName: candidate.name,
          sector: candidate.sector,
          persona: persona || undefined,
        })
        return {
          ...candidate,
          suggestedPeople: enrichedPeople
            .filter((person) => !shouldExcludeSuggestedPerson(person.title, targetTitles))
            .slice(0, 3),
        }
      }),
    )

    const ranked = withEnrichment.map(scoreCandidate)
    const sorted = applyDiversityGuardrails(ranked, REQUESTED_COUNT)

    const runSource = 'anthropic'
    let persistedRows: Array<{
      id: string
      rank: number
      name: string
      sector: string
      why: string
      fit: number
      key_signals: string[]
      key_attributes: string[]
      suggested_people: SuggestedPerson[]
    }> | null = null

    const { data: runRow } = await (supabase as any)
      .from('company_recommendation_runs')
      .insert({
        user_id: userId,
        source: runSource,
        seed_companies: seeds,
        prompt_version: 'discover-v2',
        requested_count: REQUESTED_COUNT,
        returned_count: sorted.length,
      })
      .select('id')
      .single()

    if ((runRow as { id?: string } | null)?.id) {
      await (supabase as any)
        .from('company_recommendations')
        .insert(
          sorted.map((item, index) => ({
            run_id: (runRow as { id: string }).id,
            user_id: userId,
            rank: index + 1,
            name: item.name,
            sector: item.sector,
            why: item.why,
            fit: item.fit,
            key_signals: item.keySignals ?? [],
            key_attributes: item.keyAttributes ?? [],
            suggested_people: item.suggestedPeople ?? [],
            source: runSource,
            confidence: Math.max(0.2, Math.min(0.99, item.fit / 10)),
            metadata: {
              ranking: {
                score: item.rankingScore,
                breakdown: item.rankingBreakdown,
              },
            },
          })),
        )

      const { data: topRows } = await (supabase as any)
        .from('company_recommendations')
        .select('id, rank, name, sector, why, fit, key_signals, key_attributes, suggested_people')
        .eq('run_id', (runRow as { id: string }).id)
        .order('rank', { ascending: true })
        .limit(RESPONSE_COUNT)

      persistedRows = topRows as Array<{
        id: string
        rank: number
        name: string
        sector: string
        why: string
        fit: number
        key_signals: string[]
        key_attributes: string[]
        suggested_people: SuggestedPerson[]
      }> | null
    }

    recordTrace({
      supabase, userId,
      feature: 'discovery',
      model,
      promptTokens: message.usage.input_tokens ?? 0,
      completionTokens: message.usage.output_tokens ?? 0,
      latencyMs: Date.now() - startMs,
      inputSnapshot: { seeds, target: targetTitles.slice(0, 80) },
      outputSnapshot: raw.slice(0, 500),
    })

    if (persistedRows) {
      const sourcedRows = persistedRows.filter((row) => row.suggested_people.some((person) => person.source !== 'fallback')).length
      const generatedProps = {
        source: runSource,
        recommendation_count: persistedRows.length,
        non_fallback_people_coverage_rate: Number((sourcedRows / Math.max(1, persistedRows.length)).toFixed(3)),
        seed_count: seeds.length,
        mode: 'dashboard_discover',
        confidence_band: 'medium',
        action_context: 'discover_generate',
      }
      await logEvent(userId, 'discover_recommendations_generated', generatedProps)
      captureServerEvent(userId, 'discover_recommendations_generated', generatedProps)
      await logEvent(userId, 'discover_run_created', generatedProps)
      captureServerEvent(userId, 'discover_run_created', generatedProps)

      return NextResponse.json(
        persistedRows.map((row) => ({
          ...withMoatIndicators({
            id: row.id,
            name: row.name,
            sector: row.sector,
            why: row.why,
            fit: row.fit,
            keySignals: row.key_signals,
            keyAttributes: row.key_attributes,
            suggestedPeople: row.suggested_people,
            narrativeUrl: `/dashboard/discover/recommendation/${row.id}`,
          }),
        })),
      )
    }

    const fallbackProps = {
      source: runSource,
      recommendation_count: Math.min(RESPONSE_COUNT, sorted.length),
      non_fallback_people_coverage_rate: Number(
        (
          sorted
            .slice(0, RESPONSE_COUNT)
            .filter((item) => item.suggestedPeople?.some((person) => person.source !== 'fallback'))
            .length / Math.max(1, Math.min(RESPONSE_COUNT, sorted.length))
        ).toFixed(3),
      ),
      seed_count: seeds.length,
      mode: 'dashboard_discover',
      confidence_band: 'medium',
      action_context: 'discover_generate',
    }
    await logEvent(userId, 'discover_recommendations_generated', fallbackProps)
    captureServerEvent(userId, 'discover_recommendations_generated', fallbackProps)
    await logEvent(userId, 'discover_run_created', fallbackProps)
    captureServerEvent(userId, 'discover_run_created', fallbackProps)

    return NextResponse.json(
      sorted
        .slice(0, RESPONSE_COUNT)
        .map((item) => withMoatIndicators({
          name: item.name,
          sector: item.sector,
          why: item.why,
          fit: item.fit,
          keySignals: item.keySignals ?? [],
          keyAttributes: item.keyAttributes ?? [],
          suggestedPeople: item.suggestedPeople ?? [],
        })),
    )
  } catch (err) {
    recordTraceError({ feature: 'discovery', userId, error: err instanceof Error ? err.message : String(err) })
    return NextResponse.json([], { status: 200, headers: { 'x-discover-fallback': '1' } })
  }
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
