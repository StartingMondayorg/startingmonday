import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember, hasAdminHeaderAccess } from '@/lib/staff'
import { captureServerEvent } from '@/lib/posthog-server'
import { retrieveGuide, type GuideIntent } from '@/lib/guide-retrieval'
import { readGuideRuntimeFile } from '@/app/guide-runtime-files'

type InternalEntry = {
  id: string
  title: string
  body: string
  type: string
  ref: string
  url?: string
  tags?: string[]
  qualityWeight?: number
}

type InternalIndex = {
  generatedAt: string
  entries: InternalEntry[]
}

const requestSchema = z.object({
  question: z.string().min(3).max(700),
})

function intentLead(intent: GuideIntent): string {
  if (intent === 'api_docs') return 'Internal API trace:'
  if (intent === 'getting_started') return 'Internal orientation path:'
  if (intent === 'troubleshooting') return 'Internal troubleshooting path:'
  if (intent === 'feature_howto') return 'Feature internals:'
  return 'Internal best matches:'
}

function buildAnswer(intent: GuideIntent, question: string, lines: string[], conservative: boolean): string {
  const out = [`${intentLead(intent)} ${question}`]

  if (conservative) {
    out.push('Confidence is limited, so this response is source-first. Validate against referenced files/docs directly.')
  }

  out.push(...lines)
  out.push('Use refs in sources to jump into code/docs/workflows and trace integrations end-to-end.')
  return out.join('\n')
}

async function loadInternalIndex(): Promise<InternalIndex | null> {
  /* v8 ignore next -- runtime file fallback is covered by guide-runtime-files.test.ts */
  const raw = await readGuideRuntimeFile('internal-guide.index.json')
  if (!raw) return null

  try {
    return JSON.parse(raw) as InternalIndex
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { userId } = auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const staff = await getStaffMember(user?.email ?? '')
  if (!hasAdminHeaderAccess(staff)) return NextResponse.json({ error: 'Admin or owner access required.' }, { status: 403 })
  const staffMember = staff!

  const body = await request.json().catch(() => null)
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please enter a clear question with at least 3 characters.' }, { status: 400 })
  }

  const index = await loadInternalIndex()
  if (!index || !Array.isArray(index.entries) || index.entries.length === 0) {
    return NextResponse.json({ error: 'Internal guide data is temporarily unavailable. Please retry in a moment.' }, { status: 503 })
  }

  const retrievalEntries = index.entries.map((entry) => ({
    ...entry,
    url: entry.ref,
  }))

  const retrieval = retrieveGuide(retrievalEntries as any, parsed.data.question, 6)
  if (retrieval.ranked.length === 0) {
    captureServerEvent(userId, 'internal_guide_chat_no_match', {
      query_length: parsed.data.question.length,
      role: staffMember.role,
    })

    return NextResponse.json({
      answer: 'No close internal match found. Try a route path, module name, workflow name, or migration topic.',
      sources: [],
      intent: retrieval.intent,
      confidence: retrieval.confidence,
      conservative: true,
    })
  }

  const top = retrieval.ranked.slice(0, 4)
  const answer = buildAnswer(
    retrieval.intent,
    parsed.data.question,
    top.map((item) => `- ${item.entry.title}: ${item.snippet || item.entry.body}`),
    retrieval.conservative,
  )

  captureServerEvent(userId, 'internal_guide_chat_answered', {
    query_length: parsed.data.question.length,
    role: staffMember.role,
    intent: retrieval.intent,
    confidence: retrieval.confidence,
    source_count: retrieval.ranked.length,
  })

  return NextResponse.json({
    answer,
    sources: retrieval.ranked.map((item) => ({
      id: item.entry.id,
      title: item.entry.title,
      ref: (item.entry as InternalEntry).ref ?? item.entry.url ?? '',
      score: item.score,
      type: item.entry.type,
      snippet: item.snippet,
    })),
    intent: retrieval.intent,
    confidence: retrieval.confidence,
    conservative: retrieval.conservative,
  })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
