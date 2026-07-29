import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { captureServerEvent } from '@/lib/posthog-server'
import { retrieveGuide, type GuideEntry, type GuideIntent } from '@/lib/guide-retrieval'
import { readGuideRuntimeFile } from '@/lib/guide-runtime-files'

type GuideIndex = {
  generatedAt: string
  entries: GuideEntry[]
}

const requestSchema = z.object({
  question: z.string().min(3).max(500),
})

function summarize(entry: GuideEntry, snippet?: string): string {
  const compact = (snippet && snippet.trim().length > 0 ? snippet : entry.body).replace(/\s+/g, ' ').trim()
  if (compact.length <= 170) return compact
  return `${compact.slice(0, 167)}...`
}

function intentLead(intent: GuideIntent): string {
  if (intent === 'getting_started') return 'Start here:'
  if (intent === 'api_docs') return 'API docs path:'
  if (intent === 'billing') return 'Billing resolution path:'
  if (intent === 'articles') return 'Most relevant articles:'
  if (intent === 'troubleshooting') return 'Troubleshooting path:'
  if (intent === 'feature_howto') return 'Recommended how-to flow:'
  return 'Best matches:'
}

function buildAnswer(intent: GuideIntent, question: string, top: Array<{ title: string; summary: string }>, conservative: boolean): string {
  const lines = [`${intentLead(intent)} ${question}`]

  if (conservative) {
    lines.push('Confidence is limited, so I am returning source-first guidance. Open the top source and follow it directly.')
  }

  for (const item of top) {
    lines.push(`- ${item.title}: ${item.summary}`)
  }

  if (intent === 'getting_started') {
    lines.push('Tip: complete setup checklist first, then profile, then add companies/contacts.')
  } else if (intent === 'api_docs') {
    lines.push('Tip: open the guide hub for documentation context, then use API endpoints for implementation details.')
  } else if (intent === 'billing') {
    lines.push('Trial terms: 30 days free, no credit card required, cancel anytime. You only pick a paid plan if you choose to continue after the trial.')
    lines.push('Tip: manage your plan and payment from Billing settings. If something looks wrong, send the question below for a personal reply.')
  }

  lines.push('Open the sources below for exact steps and page links.')
  return lines.join('\n')
}

// Customer-facing chat must never surface internal admin routes or raw API
// endpoints as sources. The full index remains available to the internal guide.
function isCustomerVisibleEntry(entry: GuideEntry): boolean {
  return !entry.url.startsWith('/dashboard/admin') && !entry.url.startsWith('/api/')
}

async function loadGuideIndex(): Promise<GuideIndex | null> {
  const raw = await readGuideRuntimeFile('user-guide.index.json')
  if (!raw) return null

  try {
    return JSON.parse(raw) as GuideIndex
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const supabase = await createClient()

  const body = await request.json().catch(() => null)
  const parsed = requestSchema.safeParse(body)

  if (!parsed.success) {
    captureServerEvent(auth.userId, 'guide_chat_query_invalid', { reason: 'schema_validation' })
    return NextResponse.json({ error: 'Please enter a clear question with at least 3 characters.' }, { status: 400 })
  }

  const index = await loadGuideIndex()
  if (!index || !Array.isArray(index.entries) || index.entries.length === 0) {
    captureServerEvent(auth.userId, 'guide_chat_index_unavailable')
    return NextResponse.json(
      { error: 'Guide data is temporarily unavailable. Please retry in a moment.' },
      { status: 503 },
    )
  }

  const visibleEntries = index.entries.filter(isCustomerVisibleEntry)
  if (visibleEntries.length === 0) {
    captureServerEvent(auth.userId, 'guide_chat_index_unavailable')
    return NextResponse.json(
      { error: 'Guide data is temporarily unavailable. Please retry in a moment.' },
      { status: 503 },
    )
  }

  const retrieval = retrieveGuide(visibleEntries, parsed.data.question, 5)
  const ranked = retrieval.ranked

  if (ranked.length === 0) {
    await (supabase as any).from('guide_chat_queries').insert({
      user_id: auth.userId,
      question: parsed.data.question,
      intent: retrieval.intent,
      query_status: 'no_match',
      confidence: retrieval.confidence,
      top_score: 0,
      top_source_url: null,
      source_count: 0,
      source_payload: [],
    })

    captureServerEvent(auth.userId, 'guide_chat_query_no_match', {
      query_length: parsed.data.question.length,
      index_size: index.entries.length,
      intent: retrieval.intent,
    })

    return NextResponse.json({
      answer: 'I could not find a close match in the guide yet. Try keywords like setup, profile, outreach, automation, billing, or article title.',
      sources: [],
      intent: retrieval.intent,
      confidence: retrieval.confidence,
      conservative: true,
      queryId: null,
    })
  }

  const top = ranked.slice(0, 3)
  const answer = buildAnswer(
    retrieval.intent,
    parsed.data.question,
    top.map((item) => ({ title: item.entry.title, summary: summarize(item.entry, item.snippet) })),
    retrieval.conservative,
  )

  const sourcePayload = ranked.map((item) => ({
    id: item.entry.id,
    title: item.entry.title,
    url: item.entry.url,
    score: item.score,
    type: item.entry.type,
    snippet: item.snippet,
    lexicalScore: item.lexicalScore,
    bm25Score: item.bm25Score,
    semanticScore: item.semanticScore,
  }))

  const queryInsert = await (supabase as any)
    .from('guide_chat_queries')
    .insert({
      user_id: auth.userId,
      question: parsed.data.question,
      intent: retrieval.intent,
      query_status: retrieval.conservative ? 'low_confidence' : 'answered',
      confidence: retrieval.confidence,
      top_score: ranked[0]?.score ?? 0,
      top_source_url: ranked[0]?.entry.url ?? null,
      source_count: ranked.length,
      source_payload: sourcePayload,
    })
    .select('id')
    .single()

  captureServerEvent(auth.userId, 'guide_chat_query_answered', {
    query_length: parsed.data.question.length,
    index_size: index.entries.length,
    top_score: ranked[0]?.score ?? 0,
    source_count: ranked.length,
    top_source_url: ranked[0]?.entry.url ?? '',
    intent: retrieval.intent,
    confidence: retrieval.confidence,
    conservative: retrieval.conservative,
  })

  return NextResponse.json({
    answer,
    sources: sourcePayload,
    intent: retrieval.intent,
    confidence: retrieval.confidence,
    conservative: retrieval.conservative,
    queryId: queryInsert.data?.id ?? null,
  })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
