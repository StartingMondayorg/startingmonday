import { type NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { anthropic, MODELS } from '@/lib/anthropic'
import {
  GrillMeSessionRespondSchema,
  GrillMeTurnSynthesisSchema,
  type GrillMeTurnSynthesis,
  makeFlagId,
  makeQuestionId,
  renderArtifactMarkdown,
} from '@/lib/grill-me-protocol'

type GrillSessionRow = {
  id: string
  topic: string
  goal: string
  mode: 'focused' | 'stress' | 'board'
  user_id: string
  current_question_id: string
  current_question: string
  next_question_number: number
  next_flag_number: number
  entries_count: number
  council_verdicts: Record<string, 'green' | 'yellow' | 'red'> | null
}

type GrillEntryRow = {
  question_id: string
  asked: string
  answer: string
  captured: string
  council_voices: Array<{ seat: string; reaction: string }> | null
  consequence_chains: Array<{ owner: string; first: string; second: string; third: string; risk: string }> | null
}

type GrillFlagRow = {
  flag_id: string
  description: string
  owner: string
  status: 'open' | 'closed'
}

function fallbackSynthesis(question: string, answer: string): GrillMeTurnSynthesis {
  const captured = `Founder stated: ${answer.slice(0, 450)}${answer.length > 450 ? '...' : ''}`
  return {
    captured,
    councilVoices: [
      { seat: 'Operator', reaction: 'Convert this into a specific owner and date immediately.' },
      { seat: 'Skeptic', reaction: 'This still needs harder evidence and a quantified downside case.' },
      { seat: 'Builder', reaction: 'Identify what could fail in implementation and define controls.' },
    ],
    consequenceChains: [
      {
        owner: 'Operator',
        first: 'Clear decision scope improves execution focus.',
        second: 'Focused execution raises signal quality from outcomes.',
        third: 'Higher signal quality improves subsequent strategic bets.',
        risk: 'medium',
      },
    ],
    flags: [
      { description: `Evidence detail missing for: ${question}`, owner: 'Founder' },
    ],
    ceoSummary: {
      currentStance: 'BUILDING WITH CAUTION',
      confidencePct: 58,
      primaryThesis: 'The direction appears viable if evidence quality improves quickly.',
      biggestOpenRisk: 'Assumptions remain under-specified and weakly stress-tested.',
      nextAction: 'Define pass/fail criteria and produce one validated proof point this week.',
      councilConsensus: 'Need sharper execution ownership and stronger evidence.',
      councilConflicts: 'Confidence level vs readiness pace still contested.',
    },
    councilVerdicts: {
      Operator: 'yellow',
      Skeptic: 'yellow',
      Builder: 'yellow',
      Storyteller: 'green',
      'Numbers Person': 'yellow',
      Competitor: 'yellow',
      Dalio: 'yellow',
      Duke: 'yellow',
      Munger: 'yellow',
      Bezos: 'yellow',
      Kahneman: 'yellow',
      Capitalist: 'yellow',
      'Ethicist/Risk': 'yellow',
      'Domain Expert': 'yellow',
    },
    nextQuestion: 'What assumption in this plan has the highest blast radius, and what test will you run in the next seven days to validate it?',
  }
}

async function synthesizeTurn(input: {
  topic: string
  goal: string
  mode: string
  questionId: string
  question: string
  answer: string
}): Promise<GrillMeTurnSynthesis> {
  const prompt = `You are running the Grill Me protocol with synthetic councils.
Return strict JSON for one checkpoint update.

Session:
- Topic: ${input.topic}
- Goal: ${input.goal}
- Mode: ${input.mode}
- Question ID: ${input.questionId}
- Question: ${input.question}
- Founder Answer: ${input.answer}

Return JSON keys only:
{
  "captured": string,
  "councilVoices": [{"seat": string, "reaction": string}],
  "consequenceChains": [{"owner": string, "first": string, "second": string, "third": string, "risk": "low"|"medium"|"high"|"critical"}],
  "flags": [{"description": string, "owner": string}],
  "ceoSummary": {
    "currentStance": string,
    "confidencePct": number,
    "primaryThesis": string,
    "biggestOpenRisk": string,
    "nextAction": string,
    "councilConsensus": string,
    "councilConflicts": string
  },
  "councilVerdicts": {"Seat": "green"|"yellow"|"red"},
  "nextQuestion": string
}

Rules:
- councilVoices must contain 2-4 seats.
- Use concise executive language.
- Give one hard next question.
- No markdown fences.`

  try {
    const response = await anthropic.messages.create({
      model: MODELS.haiku,
      max_tokens: 1400,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (response.content[0] as { text?: string })?.text?.trim() ?? ''
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim()
    const parsed = GrillMeTurnSynthesisSchema.safeParse(JSON.parse(cleaned))
    if (parsed.success) return parsed.data
  } catch (error) {
    Sentry.captureException(error, { extra: { route: 'grill-me/sessions/[id]/respond', op: 'synthesize' } })
  }

  return fallbackSynthesis(input.question, input.answer)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { id } = await params
  const rawBody = await request.json().catch(() => null)
  const parsed = GrillMeSessionRespondSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body' }, { status: 400 })
  }

  const supabase = await createClient()
  const grillSessions = supabase.from('executive_grill_sessions' as any) as any
  const grillEntries = supabase.from('executive_grill_entries' as any) as any

  const { data: sessionRaw, error: sessionError } = await grillSessions
    .select('id, topic, goal, mode, user_id, current_question_id, current_question, next_question_number, next_flag_number, entries_count, council_verdicts')
    .eq('id', id)
    .eq('user_id', auth.userId)
    .maybeSingle()

  const session = (sessionRaw ?? null) as GrillSessionRow | null

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const synthesis = await synthesizeTurn({
    topic: session.topic,
    goal: session.goal,
    mode: session.mode,
    questionId: session.current_question_id,
    question: session.current_question,
    answer: parsed.data.answer,
  })

  const { error: insertEntryError } = await grillEntries
    .insert({
      session_id: session.id,
      user_id: auth.userId,
      question_id: session.current_question_id,
      asked: session.current_question,
      answer: parsed.data.answer,
      captured: synthesis.captured,
      council_voices: synthesis.councilVoices,
      consequence_chains: synthesis.consequenceChains,
    })

  if (insertEntryError) {
    Sentry.captureException(insertEntryError, { extra: { route: 'grill-me/sessions/[id]/respond', op: 'insert-entry', sessionId: id, userId: auth.userId } })
    return NextResponse.json({ error: 'Failed to persist checkpoint entry' }, { status: 500 })
  }

  let flagNumber = session.next_flag_number
  const flagRows = synthesis.flags.map(flag => {
    const row = {
      session_id: session.id,
      user_id: auth.userId,
      flag_id: makeFlagId(flagNumber),
      description: flag.description,
      owner: flag.owner,
      status: 'open' as const,
    }
    flagNumber += 1
    return row
  })

  if (flagRows.length > 0) {
    const { error: flagInsertError } = await supabase
      .from('executive_grill_flags' as any)
      .insert(flagRows)

    if (flagInsertError) {
      Sentry.captureException(flagInsertError, { extra: { route: 'grill-me/sessions/[id]/respond', op: 'insert-flags', sessionId: id, userId: auth.userId } })
      return NextResponse.json({ error: 'Failed to persist flags' }, { status: 500 })
    }
  }

  const [{ data: entries }, { data: flags }] = await Promise.all([
    supabase
      .from('executive_grill_entries' as any)
      .select('question_id, asked, answer, captured, council_voices, consequence_chains')
      .eq('session_id', session.id)
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: true }),
    supabase
      .from('executive_grill_flags' as any)
      .select('flag_id, description, owner, status')
      .eq('session_id', session.id)
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: true }),
  ])

  const entryRows = ((entries ?? []) as unknown as GrillEntryRow[]).map(entry => ({
    question_id: entry.question_id,
    asked: entry.asked,
    answer: entry.answer,
    captured: entry.captured,
    council_voices: (entry.council_voices as Array<{ seat: string; reaction: string }> | null) ?? [],
    consequence_chains: (entry.consequence_chains as Array<{ owner: string; first: string; second: string; third: string; risk: string }> | null) ?? [],
  }))

  const flagList = ((flags ?? []) as unknown as GrillFlagRow[]).map(flag => ({
    flag_id: flag.flag_id,
    description: flag.description,
    owner: flag.owner,
    status: flag.status as 'open' | 'closed',
  }))

  const nextQuestionId = makeQuestionId(session.next_question_number)
  const openFlagsCount = flagList.filter(flag => flag.status === 'open').length
  const entriesCount = entryRows.length

  const ceoSummary = {
    lastUpdated: session.current_question_id,
    currentStance: synthesis.ceoSummary.currentStance,
    confidencePct: synthesis.ceoSummary.confidencePct,
    primaryThesis: synthesis.ceoSummary.primaryThesis,
    biggestOpenRisk: synthesis.ceoSummary.biggestOpenRisk,
    nextAction: synthesis.ceoSummary.nextAction,
    councilConsensus: synthesis.ceoSummary.councilConsensus,
    councilConflicts: synthesis.ceoSummary.councilConflicts,
  }

  const artifactMarkdown = renderArtifactMarkdown({
    topic: session.topic,
    goal: session.goal,
    entries: entryRows,
    flags: flagList,
    councilVerdicts: {
      ...(session.council_verdicts as Record<string, 'green' | 'yellow' | 'red'> | null),
      ...synthesis.councilVerdicts,
    },
    ceoSummary,
    nextQuestionId,
  })

  const confirmation = `✓ ${session.current_question_id} captured · next_id ${nextQuestionId} · entries ${entriesCount} · open flags ${openFlagsCount} · CEO updated`

  const { error: updateError } = await supabase
    .from('executive_grill_sessions' as any)
    .update({
      artifact_markdown: artifactMarkdown,
      current_question_id: nextQuestionId,
      current_question: synthesis.nextQuestion,
      next_question_number: session.next_question_number + 1,
      next_flag_number: flagNumber,
      entries_count: entriesCount,
      open_flags_count: openFlagsCount,
      council_verdicts: {
        ...(session.council_verdicts as Record<string, 'green' | 'yellow' | 'red'> | null),
        ...synthesis.councilVerdicts,
      },
      council_verdicts_updated: true,
      ceo_summary: ceoSummary,
      ceo_summary_updated: true,
      last_confirmation: confirmation,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.id)
    .eq('user_id', auth.userId)

  if (updateError) {
    Sentry.captureException(updateError, { extra: { route: 'grill-me/sessions/[id]/respond', op: 'update-session', sessionId: id, userId: auth.userId } })
    return NextResponse.json({ error: 'Failed to update session state' }, { status: 500 })
  }

  return NextResponse.json({
    confirmation,
    nextQuestionId,
    nextQuestion: synthesis.nextQuestion,
    artifactMarkdown,
    entriesCount,
    openFlagsCount,
  })
}
