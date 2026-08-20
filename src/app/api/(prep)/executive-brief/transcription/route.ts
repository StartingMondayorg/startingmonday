import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'

const ProviderSchema = z.enum(['otter', 'fireflies', 'fathom', 'grain', 'gong', 'other'])

const ConsentActionSchema = z.object({
  action: z.literal('consent'),
  jurisdiction: z.string().min(2).max(120),
  acknowledgedText: z.string().min(10).max(1000),
})

const ConnectActionSchema = z.object({
  action: z.literal('connect_provider'),
  provider: ProviderSchema,
  connectionLabel: z.string().max(160).optional().default(''),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
})

const IngestActionSchema = z.object({
  action: z.literal('ingest_transcript'),
  sourceType: z.enum(['paste', 'provider_import']),
  provider: ProviderSchema.optional(),
  sessionId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  title: z.string().max(200).optional().default(''),
  transcriptText: z.string().min(20).max(120000),
  notesText: z.string().max(20000).optional().default(''),
  consentId: z.string().uuid(),
})

const ActionSchema = z.union([ConsentActionSchema, ConnectActionSchema, IngestActionSchema])

type TranscriptionConsentRow = {
  id: string
  revoked_at: string | null
}

function providerNextSteps(provider: z.infer<typeof ProviderSchema>): string[] {
  const common = [
    'Confirm consent language and jurisdiction for recordings before sync.',
    'Use a dedicated workspace/service account with export permissions.',
    'Complete OAuth or API token flow in provider settings (placeholder in current build).',
    'Run a one-meeting test and validate transcript ownership mapping.',
  ]

  if (provider === 'otter') return [...common, 'Enable Otter export/API access and verify meeting owner email mapping.']
  if (provider === 'fireflies') return [...common, 'Generate Fireflies API key and allow transcript.read scope.']
  if (provider === 'fathom') return [...common, 'Enable Fathom integration endpoint and verify webhook delivery.']
  if (provider === 'grain') return [...common, 'Configure Grain export destination and include speaker labels in transcript output.']
  if (provider === 'gong') return [...common, 'Configure Gong API credentials and restrict approved call libraries.']
  return [...common, 'Document provider-specific auth flow and minimum required scopes before rollout.']
}

function analyzeTranscript(transcriptText: string, notesText: string) {
  const text = `${transcriptText}\n${notesText}`
  const lines = text
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)

  const keySignals = lines.filter(line => /priority|risk|timeline|board|budget|hiring|mandate|pressure/i.test(line)).slice(0, 8)
  const followUps = lines.filter(line => /follow up|send|schedule|next step|intro|confirm|prepare/i.test(line)).slice(0, 8)
  const potentialQuestions = lines.filter(line => /\?$/.test(line) || /^q[:\-\s]/i.test(line)).slice(0, 6)

  return {
    keySignals,
    followUps,
    potentialQuestions,
    summary: {
      hasRiskLanguage: /risk|concern|blocker|uncertain/i.test(text),
      hasDecisionLanguage: /decide|decision|tradeoff|choice/i.test(text),
      hasTimelineLanguage: /week|month|quarter|timeline|deadline/i.test(text),
    },
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const supabase = await createClient()
  const consentTable = supabase.from('executive_transcription_consents' as any) as any
  const connectionTable = supabase.from('executive_transcription_connections' as any) as any
  const transcriptTable = supabase.from('executive_meeting_transcripts' as any) as any
  const [{ data: consents }, { data: connections }, { data: transcripts }] = await Promise.all([
    consentTable
      .select('id, purpose, jurisdiction, consented_at, revoked_at')
      .eq('user_id', auth.userId)
      .order('consented_at', { ascending: false })
      .limit(10),
    connectionTable
      .select('id, provider, connection_label, status, metadata, created_at')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false })
      .limit(25),
    transcriptTable
      .select('id, title, source_type, provider, created_at, analyzed_json')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return NextResponse.json({
    consents: consents ?? [],
    connections: connections ?? [],
    transcripts: transcripts ?? [],
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const rawBody = await request.json().catch(() => null)
  const parsed = ActionSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body' }, { status: 400 })
  }

  const supabase = await createClient()
  const consentTable = supabase.from('executive_transcription_consents' as any) as any
  const connectionTable = supabase.from('executive_transcription_connections' as any) as any
  const transcriptTable = supabase.from('executive_meeting_transcripts' as any) as any

  if (parsed.data.action === 'consent') {
    const { data, error } = await consentTable
      .insert({
        user_id: auth.userId,
        jurisdiction: parsed.data.jurisdiction,
        acknowledged_text: parsed.data.acknowledgedText,
      })
      .select('id, purpose, jurisdiction, consented_at')
      .single()

    if (error || !data) {
      Sentry.captureException(error ?? new Error('consent insert returned no row'), { extra: { route: 'executive-brief/transcription', op: 'consent', userId: auth.userId } })
      return NextResponse.json({ error: 'Failed to persist transcription consent' }, { status: 500 })
    }

    return NextResponse.json({ consent: data })
  }

  if (parsed.data.action === 'connect_provider') {
    const { data, error } = await connectionTable
      .insert({
        user_id: auth.userId,
        provider: parsed.data.provider,
        connection_label: parsed.data.connectionLabel || null,
        status: 'connected',
        metadata: parsed.data.metadata,
      })
      .select('id, provider, connection_label, status, metadata, created_at')
      .single()

    if (error || !data) {
      Sentry.captureException(error ?? new Error('connection insert returned no row'), { extra: { route: 'executive-brief/transcription', op: 'connect_provider', userId: auth.userId } })
      return NextResponse.json({ error: 'Failed to save transcription provider connection' }, { status: 500 })
    }

    return NextResponse.json({
      connection: data,
      note: 'Provider connected as placeholder. OAuth/token exchange can be added per provider next.',
      nextSteps: providerNextSteps(parsed.data.provider),
    })
  }

  const consentCheck = await consentTable
    .select('id, revoked_at')
    .eq('id', parsed.data.consentId)
    .eq('user_id', auth.userId)
    .maybeSingle()

  const consentRow = (consentCheck.data ?? null) as TranscriptionConsentRow | null
  if (consentCheck.error || !consentRow || consentRow.revoked_at) {
    return NextResponse.json({ error: 'Active transcription consent is required before ingesting transcript data.' }, { status: 403 })
  }

  const analyzed = analyzeTranscript(parsed.data.transcriptText, parsed.data.notesText)

  const { data, error } = await transcriptTable
    .insert({
      user_id: auth.userId,
      session_id: parsed.data.sessionId ?? null,
      company_id: parsed.data.companyId ?? null,
      consent_id: parsed.data.consentId,
      source_type: parsed.data.sourceType,
      provider: parsed.data.provider ?? null,
      title: parsed.data.title || null,
      transcript_text: parsed.data.transcriptText,
      notes_text: parsed.data.notesText || null,
      analyzed_json: analyzed,
    })
    .select('id, created_at, analyzed_json')
    .single()

  if (error || !data) {
    Sentry.captureException(error ?? new Error('transcript insert returned no row'), { extra: { route: 'executive-brief/transcription', op: 'ingest_transcript', userId: auth.userId } })
    return NextResponse.json({ error: 'Failed to store transcript and analysis' }, { status: 500 })
  }

  return NextResponse.json({ transcript: data, analyzed })
}
