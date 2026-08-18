import { type NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { anthropic, MODELS } from '@/lib/anthropic'
import {
  GrillMeSessionCreateSchema,
  defaultCouncilVerdicts,
  initialArtifactMarkdown,
  makeQuestionId,
  slugifyBrainstorm,
} from '@/lib/grill-me-protocol'

type GrillSessionListRow = {
  id: string
  topic: string
  goal: string
  mode: 'focused' | 'stress' | 'board'
  status: string
  current_question_id: string
  current_question: string
  entries_count: number
  open_flags_count: number
  last_confirmation: string | null
  created_at: string
  updated_at: string
}

type GrillSessionCreateRow = {
  id: string
  topic: string
  goal: string
  mode: 'focused' | 'stress' | 'board'
  current_question_id: string
  current_question: string
  artifact_slug: string
  artifact_markdown: string
  entries_count: number
  open_flags_count: number
  next_question_number: number
  next_flag_number: number
}

function initialQuestionFallback(topic: string, goal: string): string {
  return `What is the single highest-stakes decision in ${topic} relative to your goal: ${goal}, and what evidence would change your mind?`
}

async function generateInitialQuestion(topic: string, goal: string, intents: string, context: string): Promise<string> {
  const prompt = `You are starting a Grill Me session. Output only one hard opening question.

Topic: ${topic}
Goal: ${goal}
Intents: ${intents || 'None'}
Context: ${context || 'None'}

Question requirements:
- One sentence.
- Forces a tradeoff and evidence.
- Executive level.
- No filler.`

  try {
    const response = await anthropic.messages.create({
      model: MODELS.haiku,
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (response.content[0] as { text?: string })?.text?.trim() ?? ''
    return text.length > 10 ? text : initialQuestionFallback(topic, goal)
  } catch (error) {
    Sentry.captureException(error, { extra: { route: 'executive-brief/grill-me/sessions', op: 'generate-initial-question' } })
    return initialQuestionFallback(topic, goal)
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const supabase = await createClient()
  const grillSessions = supabase.from('executive_grill_sessions' as any) as any
  const { data, error } = await grillSessions
    .select('id, topic, goal, mode, status, current_question_id, current_question, entries_count, open_flags_count, last_confirmation, created_at, updated_at')
    .eq('user_id', auth.userId)
    .order('updated_at', { ascending: false })
    .limit(25)

  if (error) {
    Sentry.captureException(error, { extra: { route: 'executive-brief/grill-me/sessions', op: 'list', userId: auth.userId } })
    return NextResponse.json({ sessions: [], degraded: true }, { status: 200 })
  }
  return NextResponse.json({ sessions: ((data ?? []) as GrillSessionListRow[]) })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const rawBody = await request.json().catch(() => null)
  const parsed = GrillMeSessionCreateSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body' }, { status: 400 })
  }

  const { topic, goal, intents, context, mode } = parsed.data
  const firstQuestion = await generateInitialQuestion(topic, goal, intents, context)
  const firstQuestionId = makeQuestionId(1)
  const artifactSlug = slugifyBrainstorm(topic)
  const artifactMarkdown = initialArtifactMarkdown(topic, goal, firstQuestion)

  const supabase = await createClient()

  const grillSessions = supabase.from('executive_grill_sessions' as any) as any
  const { data, error } = await grillSessions
    .insert({
      user_id: auth.userId,
      topic,
      goal,
      intents,
      context,
      mode,
      artifact_slug: artifactSlug,
      artifact_markdown: artifactMarkdown,
      current_question_id: firstQuestionId,
      current_question: firstQuestion,
      council_verdicts: defaultCouncilVerdicts(),
      ceo_summary: {
        lastUpdated: '-',
        currentStance: 'WATCHING',
        confidencePct: 0,
        primaryThesis: 'Pending first founder answer.',
        biggestOpenRisk: 'No answer captured yet.',
        nextAction: 'Answer Q-001 with concrete evidence and tradeoffs.',
        councilConsensus: 'Not yet established.',
        councilConflicts: 'Not yet established.',
      },
    })
    .select('id, topic, goal, mode, current_question_id, current_question, artifact_slug, artifact_markdown, entries_count, open_flags_count, next_question_number, next_flag_number')
    .single()

  if (error || !data) {
    Sentry.captureException(error ?? new Error('grill session insert returned no row'), { extra: { route: 'executive-brief/grill-me/sessions', op: 'create', userId: auth.userId } })
    return NextResponse.json({ error: 'Failed to create Grill Me session' }, { status: 500 })
  }

  return NextResponse.json({ session: data as GrillSessionCreateRow })
}


