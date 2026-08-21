'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  EXECUTIVE_FIRST_PRINCIPLES,
  suggestFirstPrinciples,
  type FirstPrinciple,
} from '@/lib/executive-brief-knowledge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Badge, Button, Card, Checkbox, Collapsible, CollapsibleContent, CollapsibleTrigger, Input, Label, ScrollArea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, ToggleGroup, ToggleGroupItem } from '@/components/ui'
export type ExecutiveBriefHubData = {
  userName: string | null
  companies: Array<{ id: string; name: string; stage: string }>
  briefs: Array<{
    id: string
    type: string
    createdAt: string
    companyName: string | null
    sectionName: string | null
    preview: string
    fullContent: string
  }>
  peopleToReachOut: Array<{
    id: string
    name: string
    title: string | null
    companyName: string | null
    rationale: string
    source?: 'contact' | 'suggested'
  }>
  recentInterviewSignals: Array<{
    id: string
    companyName: string
    date: string
    stage: string | null
    whatSurprised: string | null
    followUpNeeded: string | null
    whatLanded: string | null
  }>
}

const SAMPLE_BRIEFS: ExecutiveBriefHubData['briefs'] = [
  {
    id: 'sample-brief-1',
    type: 'INTERVIEW_BRIEF',
    createdAt: '2026-06-07T00:00:00.000Z',
    companyName: 'Northstar BioCompute',
    sectionName: 'VP Product Loop',
    preview: 'Interviewer is testing reliability claims, enterprise procurement realism, and decision rigor under pressure.',
    fullContent: 'Interviewer is testing reliability claims, enterprise procurement realism, and decision rigor under pressure.\n\nDetailed guidance:\n- Prove reliability with independent validation and operating metrics.\n- Show procurement-risk mitigation with week-6 and week-12 stop-loss criteria.\n- Prepare one concise board-ready narrative with risk and mitigation in under 45 seconds.',
  },
  {
    id: 'sample-brief-2',
    type: 'COUNCIL_SUMMARY',
    createdAt: '2026-06-06T00:00:00.000Z',
    companyName: 'Northstar BioCompute',
    sectionName: 'Board Lens',
    preview: 'Story is strong, but evidence stack and downside scenario thresholds are still under-specified.',
    fullContent: 'Story is strong, but evidence stack and downside scenario thresholds are still under-specified.\n\nCouncil summary:\n- Operator wants owner/timeline clarity.\n- Skeptic wants stronger disconfirming evidence.\n- Numbers Person wants explicit conversion and cost-to-serve ranges.',
  },
  {
    id: 'sample-brief-3',
    type: 'FOLLOW_UP_PLAN',
    createdAt: '2026-06-05T00:00:00.000Z',
    companyName: null,
    sectionName: null,
    preview: 'Need owner-level next steps tied to measurable checkpoints and explicit stop-loss criteria.',
    fullContent: 'Need owner-level next steps tied to measurable checkpoints and explicit stop-loss criteria.\n\nAction plan:\n- Founder: attach current conversion baseline by Friday.\n- CFO: quantify cost-to-serve model for pilot support.\n- Strategy: evidence-backed incumbent response scenario map.',
  },
]

const SAMPLE_CONTACTS: ExecutiveBriefHubData['peopleToReachOut'] = [
  {
    id: 'sample-contact-1',
    name: 'Maya Patel',
    title: 'Partner',
    companyName: 'Northbridge Ventures',
    rationale: 'Can validate board narrative expectations for Series B health AI leadership hires.',
    source: 'contact',
  },
  {
    id: 'sample-contact-2',
    name: 'Connor Lee',
    title: 'VP Clinical Ops',
    companyName: 'Meridian Health',
    rationale: 'Can pressure-test adoption assumptions in regulated deployment environments.',
    source: 'contact',
  },
  {
    id: 'sample-contact-3',
    name: 'Erin Walsh',
    title: 'Executive Recruiter',
    companyName: 'Helix Search',
    rationale: 'Can benchmark executive loop expectations for VP Product in risk-sensitive categories.',
    source: 'contact',
  },
]

const SAMPLE_SIGNALS: ExecutiveBriefHubData['recentInterviewSignals'] = [
  {
    id: 'sample-signal-1',
    companyName: 'Northstar BioCompute',
    date: '2026-06-07T00:00:00.000Z',
    stage: 'Final loop',
    whatSurprised: 'Board concern centered on reliability claims without external validation.',
    followUpNeeded: 'Deliver 90-day owner-based plan with stop-loss triggers.',
    whatLanded: null,
  },
  {
    id: 'sample-signal-2',
    companyName: 'Meridian Health',
    date: '2026-06-03T00:00:00.000Z',
    stage: 'Panel',
    whatSurprised: 'Political stakeholder mapping mattered more than feature detail.',
    followUpNeeded: 'Tighten stakeholder narrative by role.',
    whatLanded: null,
  },
]

type GrillProtocolSession = {
  id: string
  topic: string
  goal: string
  mode: 'focused' | 'stress' | 'board'
  current_question_id: string
  current_question: string
  artifact_markdown: string
  entries_count: number
  open_flags_count: number
  last_confirmation?: string | null
}

type TranscriptionProvider = 'otter' | 'fireflies' | 'fathom' | 'grain' | 'gong' | 'other'

type TranscriptionConnection = {
  id: string
  provider: TranscriptionProvider
  connection_label: string | null
  status: 'connected' | 'disconnected'
}

type TranscriptAnalyzeResult = {
  keySignals: string[]
  followUps: string[]
  potentialQuestions: string[]
  summary: {
    hasRiskLanguage: boolean
    hasDecisionLanguage: boolean
    hasTimelineLanguage: boolean
  }
}

function inferFirstPrinciples(topic: string, goal: string, intents: string): Array<{ label: string; rationale: string }> {
  const intentText = `${topic}\n${goal}\n${intents}`.toLowerCase()
  const lines: Array<{ label: string; rationale: string }> = []

  lines.push({
    label: 'Objective',
    rationale: goal.trim() || 'Define the explicit win condition before discussing tactics.',
  })

  if (intentText.includes('interview') || intentText.includes('mock') || intentText.includes('grill')) {
    lines.push({
      label: 'Evidence Standard',
      rationale: 'Answers should include concrete examples, measurable outcomes, and decision logic.',
    })
  }

  if (intentText.includes('company') || intentText.includes('market') || intentText.includes('strategy')) {
    lines.push({
      label: 'Market Constraint',
      rationale: 'Separate real market pressure from internal assumptions and aspirational narratives.',
    })
  }

  if (intentText.includes('risk') || intentText.includes('legal') || intentText.includes('transcription')) {
    lines.push({
      label: 'Risk Boundary',
      rationale: 'Define what cannot be violated: legal, privacy, or reputational constraints.',
    })
  }

  lines.push({
    label: 'Ownership',
    rationale: 'Every next action requires owner, timeline, and pass/fail criterion.',
  })

  return lines
}

function analyzeMeetingNotes(notes: string): {
  keySignals: string[]
  likelyRisks: string[]
  followUps: string[]
} {
  const rows = notes
    .split(/\n+/)
    .map(row => row.trim())
    .filter(Boolean)

  const keySignals = rows.filter(row => /signal|priority|focus|pressure|board|timeline/i.test(row)).slice(0, 5)
  const likelyRisks = rows.filter(row => /risk|concern|block|unclear|delay|budget|headcount/i.test(row)).slice(0, 5)
  const followUps = rows.filter(row => /follow|send|next|intro|schedule|confirm|prepare/i.test(row)).slice(0, 5)

  return {
    keySignals: keySignals.length > 0 ? keySignals : ['No explicit strategic signals detected.'],
    likelyRisks: likelyRisks.length > 0 ? likelyRisks : ['No explicit risk statements detected.'],
    followUps: followUps.length > 0 ? followUps : ['No explicit follow-up actions detected.'],
  }
}

function inferRoleFromTopic(topic: string): string {
  const match = topic.match(/\b(vp|chief|cto|cio|ciso|cpo|head)\b[^\n,.;]*/i)
  return match ? match[0].trim() : 'Target executive role'
}

function buildSuggestedOutreach(args: {
  companies: ExecutiveBriefHubData['companies']
  linkedInUrl: string
  topic: string
}): ExecutiveBriefHubData['peopleToReachOut'] {
  const role = inferRoleFromTopic(args.topic)
  const linkedInHint = args.linkedInUrl.trim()
    ? `LinkedIn profile context included: ${args.linkedInUrl.trim()}`
    : 'No LinkedIn profile entered yet.'

  const companySuggestions = args.companies.slice(0, 4).map((company, index) => ({
    id: `suggested-company-${company.id}`,
    name: `${company.name} hiring manager`,
    title: role,
    companyName: company.name,
    rationale: `Suggested from target company and role fit. ${linkedInHint}`,
    source: 'suggested' as const,
  }))

  if (companySuggestions.length > 0) return companySuggestions

  return [
    {
      id: 'suggested-fallback-1',
      name: 'Suggested hiring manager',
      title: role,
      companyName: 'Top target company',
      rationale: `Suggested from role intent and LinkedIn context. ${linkedInHint}`,
      source: 'suggested',
    },
    {
      id: 'suggested-fallback-2',
      name: 'Suggested recruiter contact',
      title: 'Executive Search Partner',
      companyName: 'Search firm',
      rationale: `Suggested from target role path and interview prep trajectory. ${linkedInHint}`,
      source: 'suggested',
    },
  ]
}

function providerNextSteps(provider: TranscriptionProvider): string[] {
  const common = [
    'Confirm legal consent scope and jurisdiction before syncing any recording.',
    'Create or locate a service account/workspace with export permissions.',
    'Complete OAuth/token exchange in provider settings (placeholder in current build).',
    'Run a one-meeting sync test and confirm transcript ownership mapping.',
  ]

  if (provider === 'otter') return [...common, 'Enable Otter export/API access and map meeting owner email to your workspace user.']
  if (provider === 'fireflies') return [...common, 'Generate Fireflies API key and allow transcript.read scope for the connected workspace.']
  if (provider === 'fathom') return [...common, 'Enable Fathom integration endpoint and verify transcript webhook delivery.']
  if (provider === 'grain') return [...common, 'Set Grain export destination and verify transcript text includes speaker labels.']
  if (provider === 'gong') return [...common, 'Configure Gong API credentials and restrict access to approved call libraries only.']
  return [...common, 'Document provider-specific auth flow and minimum required scopes before go-live.']
}

export function ExecutiveBriefHub({
  data,
  enableLivePrefetch = true,
}: {
  data: ExecutiveBriefHubData
  enableLivePrefetch?: boolean
}) {
  const [topic, setTopic] = useState('VP Product interview at Northstar BioCompute')
  const [goal, setGoal] = useState('Communicate executive readiness for ambiguous AI platform scaling while proving operating discipline')
  const [intents, setIntents] = useState('Pressure-test story quality, expose risk handling gaps, strengthen investor-grade decision framing')
  const [context, setContext] = useState('Series B healthtech AI platform, preparing for enterprise expansion. Interviewer is skeptical about reliability and governance')
  const [mode, setMode] = useState<'focused' | 'stress' | 'board'>('stress')
  const [selectedPrincipleIds, setSelectedPrincipleIds] = useState<string[]>([])
  const [showFirstPrinciples, setShowFirstPrinciples] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [sessionError, setSessionError] = useState('')
  const [protocolSession, setProtocolSession] = useState<GrillProtocolSession | null>(null)
  const [answerDraft, setAnswerDraft] = useState('')
  const [lastConfirmation, setLastConfirmation] = useState('')
  const [protocolSessions, setProtocolSessions] = useState<GrillProtocolSession[]>([])

  const [meetingNotes, setMeetingNotes] = useState(
    'Interviewer said board is worried about reliability claims without external validation.\nAsked whether we can survive a 2-quarter procurement delay.\nPressed on why incumbent EHR platforms will not absorb this category.\nLiked narrow wedge strategy but asked for stronger downside controls.\nRequested a 90-day plan with owners, milestones, and stop-loss criteria.'
  )
  const [meetingAnalysis, setMeetingAnalysis] = useState<ReturnType<typeof analyzeMeetingNotes> | null>(null)
  const [transcriptText, setTranscriptText] = useState('Interviewer: What evidence convinces us this survives procurement friction?\nCandidate: We track conversion and legal cycle compression with fixed thresholds...\nInterviewer: What if incumbent platforms copy this in two quarters?\nCandidate: Our moat is trust instrumentation and deployment reliability...')
  const [transcriptNotes, setTranscriptNotes] = useState('Strong board framing, still weak on quantified incumbent benchmarking.')
  const [transcriptTitle, setTranscriptTitle] = useState('Northstar VP Product Loop Round 2')
  const [transcriptAnalysis, setTranscriptAnalysis] = useState<TranscriptAnalyzeResult | null>(null)
  const [transcriptLoading, setTranscriptLoading] = useState(false)
  const [transcriptError, setTranscriptError] = useState('')

  const [jurisdiction, setJurisdiction] = useState('United States')
  const [consentChecked, setConsentChecked] = useState(false)
  const [consentId, setConsentId] = useState('')
  const [consentSaved, setConsentSaved] = useState(false)

  const [provider, setProvider] = useState<TranscriptionProvider>('otter')
  const [connectionLabel, setConnectionLabel] = useState('Northstar interview feed')
  const [providerConnections, setProviderConnections] = useState<TranscriptionConnection[]>([])
  const [providerMessage, setProviderMessage] = useState('')
  const [providerLoading, setProviderLoading] = useState(false)
  const [providerSteps, setProviderSteps] = useState<string[]>(providerNextSteps('otter'))

  const [linkedInUrl, setLinkedInUrl] = useState('https://www.linkedin.com/in/alex-morgan-product')
  const [selectedBriefId, setSelectedBriefId] = useState<string>('')
  const [interactionMode, setInteractionMode] = useState<'basic' | 'advanced'>('basic')
  const [analysisTab, setAnalysisTab] = useState<'notes' | 'transcript'>('notes')
  const [showTranscriptionPanel, setShowTranscriptionPanel] = useState(false)
  const [showHowToUse, setShowHowToUse] = useState(false)

  const displayedBriefs = data.briefs.length > 0 ? data.briefs : SAMPLE_BRIEFS
  const displayedContacts = data.peopleToReachOut.length > 0 ? data.peopleToReachOut : SAMPLE_CONTACTS
  const displayedSignals = data.recentInterviewSignals.length > 0 ? data.recentInterviewSignals : SAMPLE_SIGNALS
  const suggestedReachOut = useMemo(
    () => buildSuggestedOutreach({ companies: data.companies, linkedInUrl, topic }),
    [data.companies, linkedInUrl, topic],
  )
  const contactReachOut = displayedContacts.filter(person => person.source !== 'suggested')

  const selectedBrief = useMemo(
    () => displayedBriefs.find(brief => brief.id === selectedBriefId) ?? displayedBriefs[0] ?? null,
    [displayedBriefs, selectedBriefId],
  )

  const protocolProgress = useMemo(() => {
    const entries = protocolSession?.entries_count ?? 0
    return [
      { label: 'Session started', done: Boolean(protocolSession) },
      { label: 'Answer captured', done: entries > 0 },
      { label: 'Artifact updated', done: entries > 0 },
      { label: 'Next question ready', done: entries > 0 },
    ]
  }, [protocolSession])

  const suggestedPrinciples = useMemo(() => suggestFirstPrinciples(`${topic}\n${goal}\n${intents}\n${context}`, 6), [topic, goal, intents, context])

  const selectedPrinciples = selectedPrincipleIds.length > 0
    ? EXECUTIVE_FIRST_PRINCIPLES.filter(principle => selectedPrincipleIds.includes(principle.id))
    : suggestedPrinciples

  const firstPrinciplesPreview = useMemo(() => inferFirstPrinciples(topic, goal, intents), [topic, goal, intents])

  useEffect(() => {
    if (!enableLivePrefetch) return

    async function loadSessionsAndTranscriptionState() {
      try {
        const [sessionRes, transcriptionRes] = await Promise.all([
          fetch('/api/executive-brief/grill-me/sessions'),
          fetch('/api/executive-brief/transcription'),
        ])

        const sessionPayload = await sessionRes.json().catch(() => null) as { sessions?: GrillProtocolSession[] } | null
        if (sessionRes.ok && sessionPayload?.sessions) {
          setProtocolSessions(sessionPayload.sessions)
          if (!protocolSession && sessionPayload.sessions.length > 0) {
            setProtocolSession(sessionPayload.sessions[0])
          }
        }

        const transcriptionPayload = await transcriptionRes.json().catch(() => null) as {
          consents?: Array<{ id: string }>
          connections?: TranscriptionConnection[]
        } | null
        if (transcriptionRes.ok && transcriptionPayload) {
          if ((transcriptionPayload.consents ?? []).length > 0) {
            setConsentId(transcriptionPayload.consents![0].id)
            setConsentSaved(true)
          }
          setProviderConnections(transcriptionPayload.connections ?? [])
        }
      } catch {
        // Non-blocking: page remains usable even if preload fails.
      }
    }

    void loadSessionsAndTranscriptionState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableLivePrefetch])

  useEffect(() => {
    if (!selectedBriefId && displayedBriefs.length > 0) {
      setSelectedBriefId(displayedBriefs[0].id)
    }
  }, [displayedBriefs, selectedBriefId])

  useEffect(() => {
    setProviderSteps(providerNextSteps(provider))
  }, [provider])

  async function startGrillMeProtocol() {
    setSessionLoading(true)
    setSessionError('')
    setLastConfirmation('')

    try {
      const response = await fetch('/api/executive-brief/grill-me/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          goal,
          intents,
          context: linkedInUrl.trim()
            ? `${context}\n\nLinkedIn context supplied by user:\n${linkedInUrl.trim()}`
            : context,
          mode,
        }),
      })

      const payload = (await response.json().catch(() => null)) as { session?: GrillProtocolSession; error?: string } | null
      if (!response.ok || !payload?.session) {
        setSessionError(payload?.error ?? 'Unable to start Grill Me protocol session right now.')
        return
      }

      setProtocolSession(payload.session)
      setProtocolSessions(current => [payload.session!, ...current])
      setAnswerDraft('')
      setLastConfirmation('Protocol session started. Q-001 is ready.')
    } catch {
      setSessionError('Unable to start Grill Me protocol session right now.')
    } finally {
      setSessionLoading(false)
    }
  }

  async function submitProtocolAnswer() {
    if (!protocolSession || !answerDraft.trim()) return

    setSessionLoading(true)
    setSessionError('')

    try {
      const response = await fetch(`/api/executive-brief/grill-me/sessions/${protocolSession.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: answerDraft.trim() }),
      })

      const payload = (await response.json().catch(() => null)) as {
        confirmation?: string
        nextQuestionId?: string
        nextQuestion?: string
        artifactMarkdown?: string
        entriesCount?: number
        openFlagsCount?: number
        error?: string
      } | null

      if (!response.ok || !payload?.nextQuestion || !payload?.artifactMarkdown || !payload?.nextQuestionId) {
        setSessionError(payload?.error ?? 'Unable to process protocol answer right now.')
        return
      }

      const updatedSession: GrillProtocolSession = {
        ...protocolSession,
        current_question_id: payload.nextQuestionId,
        current_question: payload.nextQuestion,
        artifact_markdown: payload.artifactMarkdown,
        entries_count: payload.entriesCount ?? protocolSession.entries_count,
        open_flags_count: payload.openFlagsCount ?? protocolSession.open_flags_count,
        last_confirmation: payload.confirmation ?? null,
      }

      setProtocolSession(updatedSession)
      setProtocolSessions(current => current.map(item => item.id === updatedSession.id ? updatedSession : item))
      setAnswerDraft('')
      setLastConfirmation(payload.confirmation ?? '')
    } catch {
      setSessionError('Unable to process protocol answer right now.')
    } finally {
      setSessionLoading(false)
    }
  }

  async function saveTranscriptionConsent() {
    if (!consentChecked) {
      setTranscriptError('You must acknowledge legal consent before saving transcription consent.')
      return
    }

    setTranscriptLoading(true)
    setTranscriptError('')
    try {
      const response = await fetch('/api/executive-brief/transcription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'consent',
          jurisdiction,
          acknowledgedText: 'I confirm I have legal permission to transcribe and analyze meeting participants for interview and executive brief preparation.',
        }),
      })

      const payload = (await response.json().catch(() => null)) as { consent?: { id: string }; error?: string } | null
      if (!response.ok || !payload?.consent) {
        setTranscriptError(payload?.error ?? 'Failed to save transcription consent.')
        return
      }

      setConsentId(payload.consent.id)
      setConsentSaved(true)
      setProviderMessage('Consent saved.')
    } catch {
      setTranscriptError('Failed to save transcription consent.')
    } finally {
      setTranscriptLoading(false)
    }
  }

  async function connectProvider() {
    setProviderLoading(true)
    setProviderMessage('')
    setTranscriptError('')

    try {
      const response = await fetch('/api/executive-brief/transcription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect_provider',
          provider,
          connectionLabel: connectionLabel.trim(),
          metadata: {
            integration_mode: 'placeholder',
            note: 'Token exchange is intentionally deferred to provider-specific OAuth implementation.',
          },
        }),
      })

      const payload = (await response.json().catch(() => null)) as { connection?: TranscriptionConnection; note?: string; nextSteps?: string[]; error?: string } | null
      if (!response.ok || !payload?.connection) {
        setTranscriptError(payload?.error ?? 'Failed to connect transcription provider.')
        return
      }

      setProviderConnections(current => [payload.connection!, ...current])
      setProviderMessage(payload.note ?? 'Provider connected.')
      setProviderSteps(payload.nextSteps ?? providerNextSteps(provider))
      setConnectionLabel('')
    } catch {
      setTranscriptError('Failed to connect transcription provider.')
    } finally {
      setProviderLoading(false)
    }
  }

  async function ingestTranscript() {
    if (!consentId) {
      setTranscriptError('Save transcription consent before ingesting transcript content.')
      return
    }
    if (!transcriptText.trim()) {
      setTranscriptError('Transcript text is required.')
      return
    }

    setTranscriptLoading(true)
    setTranscriptError('')
    setTranscriptAnalysis(null)

    try {
      const response = await fetch('/api/executive-brief/transcription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ingest_transcript',
          sourceType: 'paste',
          provider,
          sessionId: protocolSession?.id,
          title: transcriptTitle.trim(),
          transcriptText: transcriptText.trim(),
          notesText: transcriptNotes.trim(),
          consentId,
        }),
      })

      const payload = (await response.json().catch(() => null)) as { analyzed?: TranscriptAnalyzeResult; error?: string } | null
      if (!response.ok || !payload?.analyzed) {
        setTranscriptError(payload?.error ?? 'Failed to ingest transcript.')
        return
      }

      setTranscriptAnalysis(payload.analyzed)
      setProviderMessage('Transcript saved and analyzed.')
    } catch {
      setTranscriptError('Failed to ingest transcript.')
    } finally {
      setTranscriptLoading(false)
    }
  }

  function togglePrinciple(principle: FirstPrinciple) {
    setSelectedPrincipleIds(current => (
      current.includes(principle.id)
        ? current.filter(id => id !== principle.id)
        : [...current, principle.id]
    ))
  }

  return (
    <div className="min-h-screen bg-muted font-sans">
      <nav className="bg-primary sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[10px] font-bold tracking-[0.16em] uppercase text-primary-foreground hover:opacity-80 transition-opacity" aria-label="Go to homepage">
            <span className="text-primary-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/dashboard" className="inline-flex items-center justify-center bg-primary text-primary-foreground text-[13px] font-bold px-3.5 py-1.5 rounded hover:bg-primary/90 transition-colors">
              Dashboard
            </Link>
            <Link href="/login" className="text-[13px] text-primary-foreground hover:text-primary-foreground transition-colors">Log in</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <section className="mb-6 rounded-xl bg-primary px-6 py-6 sm:px-8 sm:py-8 border border-border">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-primary mb-2">Executive Brief Hub</p>
          <h1 className="text-[30px] leading-tight font-bold text-primary-foreground">Walk into interviews with clear evidence, sharper answers, and next steps.</h1>
          <p className="text-[14px] text-primary-foreground mt-3 max-w-3xl">
            {data.userName
              ? `${data.userName}, this page turns scattered prep into one focused workflow so you stop reworking briefs and missing follow-ups.`
              : 'This page turns scattered prep into one focused workflow so you stop reworking briefs and missing follow-ups.'}
          </p>

          <Collapsible open={showHowToUse} onOpenChange={setShowHowToUse}>
            <div className="mt-5 flex flex-wrap gap-3 items-center">
              <CollapsibleTrigger
                render={
                  <Button
                    variant="outline"
                    className="border-border bg-primary text-primary-foreground"
                  />
                }
              >
                {showHowToUse ? 'Hide how to use' : 'How to use this page'}
              </CollapsibleTrigger>
              <p className="text-[12px] text-primary-foreground">Outcome: stronger interview performance with less prep stress.</p>
            </div>

            <CollapsibleContent>
              <div className="mt-4 rounded border border-border bg-primary/10 p-4">
                <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-primary mb-2">How to use</p>
                <ol className="space-y-1.5 text-[12px] text-primary-foreground list-decimal pl-4">
                  <li>Pick a brief summary to open full content and align your thesis.</li>
                  <li>Use Interview Pressure Lab to practice one question at a time and capture improvements.</li>
                  <li>Use notes/transcript analysis to surface risks and actions before your next round.</li>
                </ol>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="mt-5 flex flex-wrap gap-2 text-[12px]">
            <Link href="/dashboard/briefing" className="rounded border border-border px-2.5 py-1.5 text-primary-foreground hover:text-primary-foreground">Daily briefing</Link>
            <Link href="/dashboard/contacts" className="rounded border border-border px-2.5 py-1.5 text-primary-foreground hover:text-primary-foreground">Relationships</Link>
            <Link href="/onboarding" className="rounded border border-border px-2.5 py-1.5 text-primary-foreground hover:text-primary-foreground">Onboarding</Link>
            <Link href="/dashboard/companies/new" className="rounded border border-border px-2.5 py-1.5 text-primary-foreground hover:text-primary-foreground">Company intel</Link>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-6 mb-6">
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-[12px] font-bold tracking-[0.1em] uppercase text-muted-foreground">Brief Repository</h2>
              <p className="text-[12px] text-muted-foreground">{data.briefs.length > 0 ? `${data.briefs.length} briefs indexed` : '263 briefs indexed'}</p>
            </div>
            <p className="text-[12px] text-muted-foreground mb-3">Step 1: choose a summary card. Step 2: full brief opens immediately below that card.</p>
            <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
              {displayedBriefs.slice(0, 30).map(brief => (
                <article key={brief.id} className={`rounded-lg border p-3 ${selectedBrief?.id === brief.id ? 'border-border bg-card' : 'border-border bg-muted'}`}>
                  <button
                    type="button"
                    onClick={() => setSelectedBriefId(brief.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="text-[12px] font-semibold text-foreground uppercase tracking-[0.06em]">{brief.type}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(brief.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p className="text-[12px] text-muted-foreground mb-1">{brief.companyName ?? 'General context'}{brief.sectionName ? ` · ${brief.sectionName}` : ''}</p>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{brief.preview}</p>
                    <p className="text-[11px] font-semibold text-muted-foreground mt-2">{selectedBrief?.id === brief.id ? 'Full brief expanded below' : 'Click to expand full brief'}</p>
                  </button>

                  {selectedBrief?.id === brief.id && (
                    <div className="mt-3 rounded border border-border bg-muted p-3">
                      <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">Full Brief Content</p>
                      <pre className="whitespace-pre-wrap text-[12px] leading-relaxed text-muted-foreground font-sans">{brief.fullContent}</pre>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>

          <div className="bg-info/10 border border-info/30 rounded-xl p-5 sm:p-6">
            <h2 className="text-[12px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-4">People To Reach Out To</h2>
            <p className="text-[12px] text-muted-foreground mb-3">Combined view: contacts you entered plus suggestions from LinkedIn context and target companies/roles.</p>
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">Your contacts</p>
            <div className="space-y-3 max-h-[220px] overflow-auto pr-1 mb-4">
              {contactReachOut.slice(0, 16).map(person => (
                <article key={person.id} className="rounded-lg border border-border bg-card p-3">
                  <p className="text-[13px] font-semibold text-foreground">{person.name}</p>
                  <p className="text-[12px] text-muted-foreground">{person.title ?? 'Role not captured'}{person.companyName ? ` · ${person.companyName}` : ''}</p>
                  <p className="text-[12px] text-muted-foreground mt-1">{person.rationale}</p>
                </article>
              ))}
            </div>

            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">Suggested from LinkedIn and targets</p>
            <div className="space-y-3 max-h-[220px] overflow-auto pr-1">
              {suggestedReachOut.slice(0, 12).map(person => (
                <article key={person.id} className="rounded-lg border border-dashed border-border bg-card p-3">
                  <p className="text-[13px] font-semibold text-foreground">{person.name}</p>
                  <p className="text-[12px] text-muted-foreground">{person.title ?? 'Role suggestion'}{person.companyName ? ` · ${person.companyName}` : ''}</p>
                  <p className="text-[12px] text-muted-foreground mt-1">{person.rationale}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 mb-6">
          <div className="bg-success/10 border border-success/30 rounded-xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-[12px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Executive Pressure Lab</h2>
                <p className="text-[13px] text-muted-foreground">Practice high-pressure questions one at a time, upgrade each answer, and leave with a stronger narrative for the next interview.</p>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={() => setInteractionMode(current => current === 'basic' ? 'advanced' : 'basic')}
                  className="rounded border border-border px-3 py-1.5 text-[12px] font-semibold text-muted-foreground"
                >
                  {interactionMode === 'basic' ? 'Switch to advanced' : 'Switch to basic'}
                </button>
                <button type="button" onClick={() => setShowFirstPrinciples(current => !current)} className="rounded border border-border px-3 py-1.5 text-[12px] font-semibold text-muted-foreground">
                  {showFirstPrinciples ? 'Hide principles' : 'Show principles'}
                </button>
              </div>
            </div>

            <div className="mb-4 rounded border border-border bg-muted p-3">
              <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">Protocol Progress</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {protocolProgress.map(step => (
                  <div key={step.label} className={`rounded border px-2.5 py-2 text-[11px] ${step.done ? 'border-success/30 bg-success/10 text-success' : 'border-border bg-card text-muted-foreground'}`}>
                    {step.done ? '✓' : '•'} {step.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Topic</label>
                <input
                  aria-label="Grill me topic"
                  title="Grill me topic"
                  value={topic}
                  onChange={event => setTopic(event.target.value)}
                  className="w-full rounded border border-border px-3 py-2 text-[13px] text-foreground"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Goal</label>
                <input
                  aria-label="Grill me goal"
                  title="Grill me goal"
                  value={goal}
                  onChange={event => setGoal(event.target.value)}
                  className="w-full rounded border border-border px-3 py-2 text-[13px] text-foreground"
                />
              </div>
              {interactionMode === 'advanced' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Intents</label>
                    <textarea
                      aria-label="Grill me intents"
                      title="Grill me intents"
                      value={intents}
                      onChange={event => setIntents(event.target.value)}
                      rows={3}
                      className="w-full rounded border border-border px-3 py-2 text-[13px] text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Context</label>
                    <textarea value={context} onChange={event => setContext(event.target.value)} rows={3} className="w-full rounded border border-border px-3 py-2 text-[13px] text-foreground" placeholder="Paste company/interviewer/relationship context here." />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">LinkedIn URL (optional)</label>
                    <input value={linkedInUrl} onChange={event => setLinkedInUrl(event.target.value)} className="w-full rounded border border-border px-3 py-2 text-[13px] text-foreground" placeholder="https://www.linkedin.com/in/..." />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Mode</label>
                    <div className="flex flex-wrap gap-2">
                      {(['focused', 'stress', 'board'] as const).map(modeOption => (
                        <button
                          key={modeOption}
                          type="button"
                          onClick={() => setMode(modeOption)}
                          className={`rounded border px-3 py-1.5 text-[12px] font-semibold ${mode === modeOption ? 'border-border bg-primary text-primary-foreground' : 'border-border text-primary-foreground hover:border-border'}`}
                        >
                          {modeOption}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {showFirstPrinciples && (
              <div className="mb-4 rounded border border-border bg-muted p-3">
                <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">First principles (auto-suggested, override optional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {EXECUTIVE_FIRST_PRINCIPLES.slice(0, 16).map(principle => {
                    const isSelected = selectedPrincipleIds.includes(principle.id)
                    const isSuggested = selectedPrincipleIds.length === 0 && suggestedPrinciples.some(item => item.id === principle.id)
                    return (
                      <button
                        type="button"
                        key={principle.id}
                        onClick={() => togglePrinciple(principle)}
                        className={`text-left rounded border px-2.5 py-2 ${isSelected || isSuggested ? 'border-border bg-card' : 'border-border bg-muted hover:border-border'}`}
                      >
                        <p className="text-[12px] font-semibold text-foreground">{principle.seat}</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{principle.principle}</p>
                      </button>
                    )
                  })}
                </div>
                <div className="rounded border border-border bg-card p-3">
                  <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">First-principles decomposition preview</p>
                  <ul className="space-y-1.5">
                    {firstPrinciplesPreview.map(item => (
                      <li key={item.label} className="text-[12px] text-muted-foreground">
                        <span className="font-semibold text-foreground">{item.label}:</span> {item.rationale}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 items-center">
              <button
                type="button"
                onClick={() => {
                  void startGrillMeProtocol()
                }}
                disabled={sessionLoading}
                className="inline-flex min-h-[44px] items-center rounded bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-muted disabled:opacity-60"
              >
                {sessionLoading ? 'Starting...' : 'Start protocol session'}
              </button>
              {sessionError && <p className="text-[12px] text-destructive">{sessionError}</p>}
            </div>

            {protocolSession && (
              <div className="mt-5 space-y-4">
                <article className="rounded border border-border bg-muted p-3">
                  <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Current Protocol Question</p>
                  <p className="text-[12px] text-muted-foreground mb-1">{protocolSession.current_question_id} · entries {protocolSession.entries_count} · open flags {protocolSession.open_flags_count}</p>
                  <p className="text-[14px] font-semibold text-foreground">{protocolSession.current_question}</p>
                </article>

                <article className="rounded border border-border bg-muted p-3">
                  <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Founder Answer</p>
                  <textarea
                    value={answerDraft}
                    onChange={event => setAnswerDraft(event.target.value)}
                    rows={6}
                    className="w-full rounded border border-border px-3 py-2 text-[13px] text-foreground"
                    placeholder="Answer this question directly. One answer triggers one checkpoint update."
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        void submitProtocolAnswer()
                      }}
                      disabled={sessionLoading || !answerDraft.trim()}
                      className="inline-flex min-h-[40px] items-center rounded border border-border bg-primary px-3 py-2 text-[12px] font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      {sessionLoading ? 'Capturing...' : 'Capture answer and ask next'}
                    </button>
                    {(lastConfirmation || protocolSession.last_confirmation) && (
                      <p className="text-[12px] text-success">{lastConfirmation || protocolSession.last_confirmation}</p>
                    )}
                  </div>
                </article>

                <article className="rounded border border-border bg-muted p-3">
                  <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">Capture Artifact (Live)</p>
                  <pre className="max-h-[460px] overflow-auto whitespace-pre-wrap rounded border border-border bg-card p-3 text-[11px] leading-relaxed text-foreground">
                    {protocolSession.artifact_markdown}
                  </pre>
                </article>
              </div>
            )}
          </div>

          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-5 sm:p-6">
            <h2 className="text-[12px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3">Recent Interview Signal Log</h2>
            <div className="space-y-3 max-h-[380px] overflow-auto pr-1 mb-4">
              {displayedSignals.slice(0, 14).map(signal => (
                <article key={signal.id} className="rounded-lg border border-border bg-muted p-3">
                  <p className="text-[12px] font-semibold text-foreground">{signal.companyName}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(signal.date).toLocaleDateString()} {signal.stage ? `· ${signal.stage}` : ''}</p>
                  {signal.whatSurprised && <p className="text-[12px] text-muted-foreground mt-1"><span className="font-semibold">Surprise:</span> {signal.whatSurprised}</p>}
                  {signal.followUpNeeded && <p className="text-[12px] text-muted-foreground mt-1"><span className="font-semibold">Follow-up:</span> {signal.followUpNeeded}</p>}
                </article>
              ))}
            </div>

            <div className="mt-4 rounded border border-border bg-muted p-3">
              <div className="mb-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAnalysisTab('notes')}
                  className={`rounded px-3 py-1.5 text-[12px] font-semibold ${analysisTab === 'notes' ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-card-foreground'}`}
                >
                  Notes analysis
                </button>
                <button
                  type="button"
                  onClick={() => setAnalysisTab('transcript')}
                  className={`rounded px-3 py-1.5 text-[12px] font-semibold ${analysisTab === 'transcript' ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-card-foreground'}`}
                >
                  Transcript analysis
                </button>
              </div>

              {analysisTab === 'notes' && (
                <>
                  <h3 className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">Meeting Notes Analyzer</h3>
                  <textarea
                    value={meetingNotes}
                    onChange={event => setMeetingNotes(event.target.value)}
                    rows={7}
                    className="w-full rounded border border-border px-3 py-2 text-[13px] text-foreground mb-3"
                    placeholder="Paste notes. Example: interviewer asked about scaling risk, board pressure on timeline, asked for 90-day plan..."
                  />
                  <button
                    type="button"
                    onClick={() => setMeetingAnalysis(analyzeMeetingNotes(meetingNotes))}
                    className="inline-flex min-h-[40px] items-center rounded border border-border bg-primary px-3 py-2 text-[12px] font-semibold text-primary-foreground"
                  >
                    Analyze notes
                  </button>

                  {meetingAnalysis && (
                    <div className="mt-4 space-y-3">
                      <article className="rounded border border-border bg-card p-3">
                        <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Key Signals</p>
                        <ul className="space-y-1">
                          {meetingAnalysis.keySignals.map(item => <li key={item} className="text-[12px] text-muted-foreground">- {item}</li>)}
                        </ul>
                      </article>
                      <article className="rounded border border-border bg-card p-3">
                        <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Likely Risks</p>
                        <ul className="space-y-1">
                          {meetingAnalysis.likelyRisks.map(item => <li key={item} className="text-[12px] text-muted-foreground">- {item}</li>)}
                        </ul>
                      </article>
                      <article className="rounded border border-border bg-card p-3">
                        <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Follow-Ups</p>
                        <ul className="space-y-1">
                          {meetingAnalysis.followUps.map(item => <li key={item} className="text-[12px] text-muted-foreground">- {item}</li>)}
                        </ul>
                      </article>
                    </div>
                  )}
                </>
              )}

              {analysisTab === 'transcript' && (
                <>
                  <h3 className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">Transcription Consent and Integration</h3>
                  <p className="text-[12px] text-muted-foreground mb-3">Choose a transcription service or paste transcripts directly. Consent is required before transcript analysis.</p>

                  <button
                    type="button"
                    onClick={() => setShowTranscriptionPanel(current => !current)}
                    className="mb-3 inline-flex min-h-[38px] items-center rounded border border-border bg-card px-3 py-2 text-[12px] font-semibold text-muted-foreground"
                  >
                    {showTranscriptionPanel ? 'Hide transcription setup' : 'Show transcription setup'}
                  </button>

                  {showTranscriptionPanel && (
                    <>
                      <div className="rounded border border-border bg-card p-3 mb-3">
                <label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Jurisdiction</label>
                <input
                  value={jurisdiction}
                  onChange={event => setJurisdiction(event.target.value)}
                  className="w-full rounded border border-border px-3 py-2 text-[13px] text-foreground mb-2"
                  placeholder="State/Country where recording laws apply"
                />
                <label className="flex items-start gap-2 text-[12px] text-muted-foreground mb-2">
                  <input type="checkbox" checked={consentChecked} onChange={event => setConsentChecked(event.target.checked)} className="mt-0.5" />
                  <span>I confirm I have lawful consent from relevant participants to transcribe and analyze this meeting content.</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    void saveTranscriptionConsent()
                  }}
                  disabled={transcriptLoading}
                  className="inline-flex min-h-[40px] items-center rounded border border-border px-3 py-2 text-[12px] font-semibold text-muted-foreground disabled:opacity-60"
                >
                  {transcriptLoading ? 'Saving...' : (consentSaved ? 'Consent saved' : 'Save consent')}
                </button>
              </div>

              <div className="rounded border border-border bg-card p-3 mb-3">
                <label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Transcription provider</label>
                <select
                  value={provider}
                  onChange={event => setProvider(event.target.value as TranscriptionProvider)}
                  aria-label="Transcription provider"
                  title="Transcription provider"
                  className="w-full rounded border border-border px-3 py-2 text-[13px] text-foreground mb-2"
                >
                  <option value="otter">Otter</option>
                  <option value="fireflies">Fireflies</option>
                  <option value="fathom">Fathom</option>
                  <option value="grain">Grain</option>
                  <option value="gong">Gong</option>
                  <option value="other">Other</option>
                </select>
                <input
                  value={connectionLabel}
                  onChange={event => setConnectionLabel(event.target.value)}
                  className="w-full rounded border border-border px-3 py-2 text-[13px] text-foreground mb-2"
                  placeholder="Connection label (optional)"
                />
                <button
                  type="button"
                  onClick={() => {
                    void connectProvider()
                  }}
                  disabled={providerLoading}
                  className="inline-flex min-h-[40px] items-center rounded border border-border px-3 py-2 text-[12px] font-semibold text-muted-foreground disabled:opacity-60"
                >
                  {providerLoading ? 'Connecting...' : 'Connect provider (placeholder)'}
                </button>
                {providerMessage && <p className="text-[11px] text-success mt-2">{providerMessage}</p>}
                {providerConnections.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {providerConnections.slice(0, 5).map(connection => (
                      <p key={connection.id} className="text-[11px] text-muted-foreground">{connection.provider} · {connection.connection_label ?? 'No label'} · {connection.status}</p>
                    ))}
                  </div>
                )}

                <div className="mt-3 rounded border border-border bg-card p-3">
                  <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">Verified next steps ({provider})</p>
                  <ul className="space-y-1.5">
                    {providerSteps.map(step => (
                      <li key={step} className="text-[11px] text-muted-foreground">- {step}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded border border-border bg-card p-3">
                <label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Transcript title (optional)</label>
                <input
                  value={transcriptTitle}
                  onChange={event => setTranscriptTitle(event.target.value)}
                  className="w-full rounded border border-border px-3 py-2 text-[13px] text-foreground mb-2"
                  placeholder="Hiring manager interview - round 2"
                />
                <label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Paste transcript</label>
                <textarea
                  value={transcriptText}
                  onChange={event => setTranscriptText(event.target.value)}
                  rows={6}
                  className="w-full rounded border border-border px-3 py-2 text-[13px] text-foreground mb-2"
                  placeholder="Paste raw transcript text here."
                />
                <label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Notes (optional)</label>
                <textarea
                  value={transcriptNotes}
                  onChange={event => setTranscriptNotes(event.target.value)}
                  rows={3}
                  className="w-full rounded border border-border px-3 py-2 text-[13px] text-foreground mb-2"
                  placeholder="Paste additional notes or context."
                />
                <button
                  type="button"
                  onClick={() => {
                    void ingestTranscript()
                  }}
                  disabled={transcriptLoading}
                  className="inline-flex min-h-[40px] items-center rounded border border-border bg-primary px-3 py-2 text-[12px] font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {transcriptLoading ? 'Saving...' : 'Save and analyze transcript'}
                </button>
                {transcriptError && <p className="text-[11px] text-destructive mt-2">{transcriptError}</p>}

                {transcriptAnalysis && (
                  <div className="mt-3 space-y-2 rounded border border-border bg-card p-3">
                    <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground">Transcript Analysis</p>
                    <p className="text-[11px] text-muted-foreground">Signals: {transcriptAnalysis.keySignals.length} · Follow-ups: {transcriptAnalysis.followUps.length} · Questions: {transcriptAnalysis.potentialQuestions.length}</p>
                    <p className="text-[11px] text-muted-foreground">Risk language: {transcriptAnalysis.summary.hasRiskLanguage ? 'yes' : 'no'} · Decision language: {transcriptAnalysis.summary.hasDecisionLanguage ? 'yes' : 'no'} · Timeline language: {transcriptAnalysis.summary.hasTimelineLanguage ? 'yes' : 'no'}</p>
                  </div>
                )}
              </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {protocolSessions.length > 0 && (
          <section className="bg-card border border-border rounded-xl p-5 sm:p-6">
            <h2 className="text-[12px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3">Saved Grill Me Sessions</h2>
            <div className="space-y-2">
              {protocolSessions.slice(0, 8).map(session => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => {
                    setProtocolSession(session)
                    setLastConfirmation(session.last_confirmation ?? '')
                  }}
                  className="w-full rounded border border-border bg-muted px-3 py-2 text-left"
                >
                  <p className="text-[12px] font-semibold text-foreground">{session.topic}</p>
                  <p className="text-[11px] text-muted-foreground">{session.current_question_id} · entries {session.entries_count} · open flags {session.open_flags_count}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-6 rounded-xl border border-border bg-primary px-6 py-6 text-primary-foreground">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <p className="text-[11px] font-bold tracking-[0.16em] uppercase">
              <span className="text-primary-foreground">Starting </span><span className="text-primary">Monday</span>
            </p>
            <div className="flex flex-wrap gap-4 text-[12px]">
              <Link href="/privacy" className="text-primary-foreground hover:text-primary-foreground">Privacy policy</Link>
              <Link href="/evidence-hub" className="text-primary-foreground hover:text-primary-foreground">Evidence Hub</Link>
              <Link href="/dashboard" className="text-primary-foreground hover:text-primary-foreground">Dashboard</Link>
              <Link href="/login" className="text-primary-foreground hover:text-primary-foreground">Sign in</Link>
            </div>
          </div>
          <p className="text-[12px] text-primary-foreground">Private by default. Built for disciplined executive search execution with early signal and low-noise workflows.</p>
          <p className="text-[12px] text-primary-foreground mt-2">© 2026 Starting Monday. All rights reserved.</p>
        </footer>
      </main>
    </div>
  )
}

