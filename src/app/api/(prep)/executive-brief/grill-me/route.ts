import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { requireAuth } from '@/lib/require-auth'
import { anthropic, MODELS } from '@/lib/anthropic'
import {
  EXECUTIVE_FIRST_PRINCIPLES,
  EXECUTIVE_MENTAL_MODELS,
  suggestFirstPrinciples,
  suggestMentalModels,
} from '@/lib/executive-brief-knowledge'

const GrillMeRequestSchema = z.object({
  topic: z.string().min(5).max(400),
  goal: z.string().min(5).max(400),
  intents: z.string().max(2000).default(''),
  context: z.string().max(6000).default(''),
  mode: z.enum(['focused', 'stress', 'board']).default('focused'),
  selectedModelIds: z.array(z.string()).max(20).default([]),
  selectedPrincipleIds: z.array(z.string()).max(20).default([]),
})

type GrillMeResponse = {
  openingQuestion: string
  recommendedAnswerFrame: string
  lineOfQuestioning: Array<{
    id: string
    question: string
    whyItMatters: string
    linkedModels: string[]
    linkedPrinciples: string[]
  }>
  councilVoices: Array<{
    seat: string
    reaction: string
  }>
  successRubric: Array<{
    dimension: string
    whatGreatLooksLike: string
  }>
  firstPrinciplesBreakdown: Array<{
    principle: string
    application: string
  }>
  mentalModelsApplied: Array<{
    model: string
    reason: string
    source: string
  }>
}

function toPlainTextList(values: string[]): string {
  return values.map((value, index) => `${index + 1}. ${value}`).join('\n')
}

function safeParseJsonResponse(raw: string): GrillMeResponse | null {
  try {
    return JSON.parse(raw) as GrillMeResponse
  } catch {
    return null
  }
}

function buildFallbackResponse(
  topic: string,
  goal: string,
  chosenModels: ReturnType<typeof suggestMentalModels>,
  chosenPrinciples: ReturnType<typeof suggestFirstPrinciples>,
): GrillMeResponse {
  return {
    openingQuestion: `What specific decision must you make about ${topic} in the next 7 days, and what evidence would convince you to change your mind?`,
    recommendedAnswerFrame: `Decision: ${goal}\nEvidence: [observable signals]\nTradeoffs: [what you are giving up]\nRisk controls: [buffers and kill criteria]\nNext action owner/date: [owner + date]`,
    lineOfQuestioning: [
      {
        id: 'Q-001',
        question: `What is the highest-stakes assumption in your ${topic} plan?`,
        whyItMatters: 'Most execution failures come from untested assumptions, not poor effort.',
        linkedModels: chosenModels.slice(0, 2).map(model => model.name),
        linkedPrinciples: chosenPrinciples.slice(0, 2).map(principle => principle.principle),
      },
      {
        id: 'Q-002',
        question: 'What is your bear case if your best assumption is wrong by 50 percent?',
        whyItMatters: 'Downside planning improves strategic resilience.',
        linkedModels: ['Inversion', 'Margin of Safety'],
        linkedPrinciples: ['Every bull case requires an explicit bear case.'],
      },
      {
        id: 'Q-003',
        question: 'What first-principles constraints are non-negotiable here?',
        whyItMatters: 'Constraints prevent narrative drift and improve decision speed.',
        linkedModels: ['First Principles Decomposition'],
        linkedPrinciples: chosenPrinciples.slice(0, 2).map(principle => principle.principle),
      },
    ],
    councilVoices: [
      { seat: 'Operator', reaction: 'Name the owner, deadline, and pass/fail condition or this is not executable.' },
      { seat: 'Skeptic', reaction: 'Show base rates and one concrete way this fails despite strong effort.' },
      { seat: 'Builder', reaction: 'Define reliability and confidence thresholds before this touches users.' },
    ],
    successRubric: [
      { dimension: 'Clarity', whatGreatLooksLike: 'Answer is concise, structured, and specific.' },
      { dimension: 'Evidence', whatGreatLooksLike: 'Claims are tied to observable facts or bounded assumptions.' },
      { dimension: 'Tradeoff Quality', whatGreatLooksLike: 'Explicitly states what will not be pursued.' },
      { dimension: 'Risk Handling', whatGreatLooksLike: 'Includes downside controls and kill criteria.' },
      { dimension: 'Executive Posture', whatGreatLooksLike: 'Demonstrates ownership, calm, and decision readiness.' },
    ],
    firstPrinciplesBreakdown: chosenPrinciples.slice(0, 5).map(principle => ({
      principle: principle.principle,
      application: `Apply this principle to evaluate decisions on ${topic}.`,
    })),
    mentalModelsApplied: chosenModels.slice(0, 5).map(model => ({
      model: model.name,
      reason: `This model helps pressure-test ${topic} against ${goal}.`,
      source: model.source,
    })),
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const rawBody = await request.json().catch(() => null)
  const parsed = GrillMeRequestSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body' }, { status: 400 })
  }

  const { topic, goal, intents, context, mode, selectedModelIds, selectedPrincipleIds } = parsed.data

  const suggestedModels = suggestMentalModels(`${topic}\n${goal}\n${intents}\n${context}`, 8)
  const suggestedPrinciples = suggestFirstPrinciples(`${topic}\n${goal}\n${intents}\n${context}`, 8)

  const selectedModels = selectedModelIds.length > 0
    ? EXECUTIVE_MENTAL_MODELS.filter(model => selectedModelIds.includes(model.id)).slice(0, 8)
    : suggestedModels

  const selectedPrinciples = selectedPrincipleIds.length > 0
    ? EXECUTIVE_FIRST_PRINCIPLES.filter(principle => selectedPrincipleIds.includes(principle.id)).slice(0, 8)
    : suggestedPrinciples

  const modelContextLines = selectedModels.map(model => `${model.name} (${model.source}) - ${model.summary}`)
  const principleContextLines = selectedPrinciples.map(principle => `${principle.seat}: ${principle.principle}`)

  const systemPrompt = `You are the Starting Monday Executive Brief Grill Me engine.
Use rigorous first-principles decomposition and selective council pressure testing.

Non-negotiable style rules:
- Senior, direct, specific language.
- No motivational filler.
- Ask hard questions that force tradeoffs and evidence.
- Keep each question concise and interview-grade.
- Use only the provided model/principle context.
- Output valid JSON only.`

  const userPrompt = `Build a Grill Me session in JSON with keys:
openingQuestion,
recommendedAnswerFrame,
lineOfQuestioning (array of { id, question, whyItMatters, linkedModels, linkedPrinciples }),
councilVoices (array of { seat, reaction }),
successRubric (array of { dimension, whatGreatLooksLike }),
firstPrinciplesBreakdown (array of { principle, application }),
mentalModelsApplied (array of { model, reason, source }).

Session input:
- Topic: ${topic}
- Goal: ${goal}
- Mode: ${mode}
- Intents:\n${intents || 'None provided'}
- Context:\n${context || 'None provided'}

Use these mental models:\n${toPlainTextList(modelContextLines)}

Use these first principles:\n${toPlainTextList(principleContextLines)}

Council activation guidance:
- Always include Operator + Skeptic.
- Add Builder for implementation risk.
- Add Storyteller for messaging and interview posture.
- Add Numbers Person for economics or offer decisions.

Also include at least one question for strengths and weaknesses framing and one question that probes thinking style under uncertainty.`

  try {
    const result = await anthropic.messages.create({
      model: MODELS.haiku,
      max_tokens: 1400,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const raw = (result.content[0] as { text?: string })?.text?.trim() ?? ''
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim()
    const parsedResponse = safeParseJsonResponse(cleaned)

    const payload = parsedResponse ?? buildFallbackResponse(topic, goal, selectedModels, selectedPrinciples)
    return NextResponse.json({
      data: payload,
      selectedModelIds: selectedModels.map(model => model.id),
      selectedPrincipleIds: selectedPrinciples.map(principle => principle.id),
    })
  } catch (error) {
    Sentry.captureException(error, { extra: { route: 'executive-brief/grill-me', op: 'generate', userId: auth.userId } })
    const payload = buildFallbackResponse(topic, goal, selectedModels, selectedPrinciples)
    return NextResponse.json({
      data: payload,
      selectedModelIds: selectedModels.map(model => model.id),
      selectedPrincipleIds: selectedPrinciples.map(principle => principle.id),
      fallback: true,
    })
  }
}
