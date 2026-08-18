import { type NextRequest, NextResponse } from 'next/server'
import { requirePrepAccess } from '@/lib/require-prep-access'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { isRateLimited, trackApiUsage } from '@/lib/api-usage'
import { PREP_SYSTEM, personaContext, roleTypeContext, transitionModeContext, interviewStageContext, type InterviewStage } from '@/lib/ai/prompts'
import type { CareerEntry } from '@/app/components/CareerVerificationPanel'
import { RESUME_CHARS } from '@/lib/ai/ai-limits'
import { isDemoUser, streamDemoText, DEMO_PREP_BRIEFS } from '@/lib/demo'
import { encodeUserId } from '@/lib/watermark'
import { streamErrorMessage } from '@/lib/stream-error'
import { getRoleModePromptPack, isPrepRoleMode, type PrepRoleMode } from '@/lib/prep/prep-role-modes'
import { extractTextFromHtml, isAllowedJobUrl, normalizeInterviewStage } from '@/lib/prep/prep-route-utils'
import {
  buildScanSection, buildSignalSection, buildContactSection, buildDocSection, buildCompanyFocusBrief,
  type Signal, type ScanRow, type ContactRow, type DocRow,
} from '@/lib/prep/prep-context'
import Anthropic from '@anthropic-ai/sdk'
import { anthropic, MODELS, getModelForTier } from '@/lib/ai/anthropic'
import { PrepRefineBodySchema, PrepRouteParamsSchema, PrepGenerateQuerySchema, firstZodError } from '@/lib/schemas'
import { recordTrace, recordTraceError } from '@/lib/trace'
import { apiError } from '@/lib/api-error'
import { buildSearchIntakeSection } from '@/lib/search-intake'

type TraceOpts = { feature: string; inputSnapshot?: Record<string, unknown> }

function makeStream(messages: Anthropic.MessageParam[], maxTokens: number, supabase: Awaited<ReturnType<typeof createClient>>, userId: string, model: string, traceOpts?: TraceOpts) {
  const encoder = new TextEncoder()
  const startMs = Date.now()
  // Shared with cancel(): when the client disconnects mid-generation, the
  // controller closes and any further enqueue throws "Invalid state:
  // Controller is already closed". Guard every enqueue and abort the
  // upstream Anthropic stream so tokens stop billing.
  let closed = false
  let anthropicStream: ReturnType<typeof anthropic.messages.stream> | null = null
  return new ReadableStream({
    async start(controller) {
      const safeEnqueue = (chunk: Uint8Array) => {
        if (closed) return
        try { controller.enqueue(chunk) } catch { closed = true }
      }
      const safeClose = () => {
        if (closed) return
        try { controller.close() } catch { /* already closed */ }
        closed = true
      }
      try {
        const stream = anthropic.messages.stream({
          model,
          max_tokens: maxTokens,

          system: PREP_SYSTEM,
          messages,
        })
        anthropicStream = stream
        let outputBuffer = ''
        stream.on('text', text => {
          safeEnqueue(encoder.encode(text))
          if (traceOpts && outputBuffer.length < 2000) outputBuffer += text
        })
        const final = await stream.finalMessage()
        if (final.stop_reason === 'max_tokens') {
          console.warn(JSON.stringify({
            ts: new Date().toISOString(), event: 'prep_brief_truncated',
            feature: traceOpts?.feature ?? 'prep_brief', userId, model, maxTokens,
          }))
        }
        safeEnqueue(encoder.encode(encodeUserId(userId)))
        safeClose()
        const tokens = (final.usage.input_tokens ?? 0) + (final.usage.output_tokens ?? 0)
        trackApiUsage(supabase, userId, tokens).catch(() => {})
        if (traceOpts) {
          recordTrace({
            supabase, userId, feature: traceOpts.feature, model,
            promptTokens: final.usage.input_tokens ?? 0,
            completionTokens: final.usage.output_tokens ?? 0,
            latencyMs: Date.now() - startMs,
            inputSnapshot: traceOpts.inputSnapshot,
            outputSnapshot: outputBuffer,
          })
        }
      } catch (err) {
        const feature = traceOpts?.feature ?? 'prep_brief'
        const errStr = err instanceof Error ? err.message : 'Unknown error'
        console.error('[prep-route] stream failure', { feature, userId, model, error: errStr })
        recordTraceError({ feature, userId, model, latencyMs: Date.now() - startMs, error: errStr })
        safeEnqueue(encoder.encode(streamErrorMessage(err, { feature, userId })))
        safeClose()
      }
    },
    cancel() {
      closed = true
      try { anthropicStream?.abort() } catch { /* best effort */ }
    },
  })
}

async function loadContext(supabase: Awaited<ReturnType<typeof createClient>>, companyId: string, userId: string) {
  const since90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const companyResult = await supabase
    .from('companies')
    .select('name, sector, stage, company_size, notes, competitive_context, interview_notes')
    .eq('id', companyId)
    .eq('user_id', userId)
    .single()
  const company = (companyResult.data as CompanyRow | null) ?? null

  const [{ data: profile }, { data: scanResults }, { data: contacts }, { data: documents }, { data: interviewLogs }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('full_name, current_title, current_company, target_titles, target_sectors, positioning_summary, resume_text, beyond_resume, search_persona, role_type, career_history_json, role_context, star_stories')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('scan_results')
      .select('scanned_at, ai_score, ai_summary, raw_hits')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .eq('status', 'success')
      .order('scanned_at', { ascending: false })
      .limit(1),
    supabase
      .from('contacts')
      .select('name, title, firm, channel, notes')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .eq('status', 'active'),
    supabase
      .from('company_documents')
      .select('label, content')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
    supabase
      .from('company_interview_logs')
      .select('interview_date, interview_stage, questions_asked, what_landed, what_surprised, follow_up_needed')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .order('interview_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(10),
  ])
  const primarySignalSelect = 'signal_type, signal_summary, outreach_angle, signal_date, confidence, source_kind, focus_tags, evidence_snippets, filing_form, filing_items, partner_entities'
  const fallbackSignalSelect = 'signal_type, signal_summary, outreach_angle, signal_date'

  let signals: Signal[] | null = null

  const enrichedSignals = await supabase
    .from('company_signals')
    .select(primarySignalSelect)
    .eq('company_id', companyId)
    .eq('user_id', userId)
    .gte('signal_date', since90d)
    .order('signal_date', { ascending: false })
    .limit(8)

  if (enrichedSignals.error) {
    const basicSignals = await supabase
      .from('company_signals')
      .select(fallbackSignalSelect)
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .gte('signal_date', since90d)
      .order('signal_date', { ascending: false })
      .limit(8)
    signals = (basicSignals.data as Signal[] | null) ?? null
  } else {
    signals = (enrichedSignals.data as Signal[] | null) ?? null
  }

  return { company, profile, scanResults, contacts, documents, signals, interviewLogs }
}

type ProfileRow = {
  full_name?: string | null; current_title?: string | null; current_company?: string | null
  target_titles?: string[] | null; target_sectors?: string[] | null
  positioning_summary?: string | null; resume_text?: string | null; beyond_resume?: string | null
  search_persona?: string | null; role_type?: string | null; career_history_json?: unknown | null
  role_context?: Record<string, unknown> | null; star_stories?: unknown | null
}
type CompanyRow = { name: string; sector?: string | null; stage: string; company_size?: string | null; notes?: string | null; competitive_context?: string | null; interview_notes?: string | null }
type InterviewLogRow = { interview_date: string | null; interview_stage: string | null; questions_asked: string | null; what_landed: string | null; what_surprised: string | null; follow_up_needed: string | null }

function buildRoleSpecificContext(profile: ProfileRow | null): string {
  if (!profile?.role_context) return ''
  const ctx = profile.role_context
  const lines: string[] = []

  if (profile.role_type === 'ciso') {
    const sf = ctx.security_frameworks as string[] | undefined
    if (sf?.length) lines.push(`Security frameworks implemented: ${sf.join(', ')}`)
    if (ctx.board_security_maturity) lines.push(`Board security maturity context: ${ctx.board_security_maturity}`)
  }

  if (profile.role_type === 'cpo') {
    if (ctx.product_type_exp) lines.push(`Product experience type: ${ctx.product_type_exp}`)
    if (ctx.product_achievement) lines.push(`Key product achievement: ${ctx.product_achievement}`)
    if (ctx.product_metric) lines.push(`Primary metric moved: ${ctx.product_metric}`)
  }

  if (profile.role_type === 'coo') {
    const mt = ctx.coo_mandate_types as string[] | undefined
    if (mt?.length) lines.push(`Mandate types targeted: ${mt.join(', ')}`)
    if (ctx.coo_ceo_partnership) lines.push(`CEO partnership model: ${ctx.coo_ceo_partnership}`)
  }

  if (profile.role_type === 'cto') {
    const tf = ctx.cto_technical_flavor as string[] | undefined
    if (tf?.length) lines.push(`Technical flavor: ${tf.join(', ')}`)
    if (ctx.cto_architecture_decision) lines.push(`Key architectural decision: ${ctx.cto_architecture_decision}`)
  }

  if (profile.role_type === 'cdo_data') {
    if (ctx.data_maturity_orientation) lines.push(`Data mandate orientation: ${ctx.data_maturity_orientation}`)
    if (ctx.data_platform_built) lines.push(`Data platform built: ${ctx.data_platform_built}`)
  }

  if (profile.role_type === 'cdo_digital') {
    if (ctx.digital_background_type) lines.push(`Professional background: ${ctx.digital_background_type}`)
    if (ctx.digital_transformation_delivered) lines.push(`Business transformation delivered: ${ctx.digital_transformation_delivered}`)
  }

  return lines.length > 0 ? '\n' + lines.join('\n') : ''
}

type StarStory = { id?: string; situation: string; action: string; result: string; tags?: string[] }

function buildStarStoriesSection(profile: ProfileRow | null): string {
  const stories = Array.isArray(profile?.star_stories) ? (profile.star_stories as StarStory[]) : []
  if (stories.length === 0) return ''
  const lines = stories.map((s, i) => {
    const tags = (s.tags ?? []).length > 0 ? ` [applies to: ${s.tags!.join(', ')}]` : ''
    return `Story ${i + 1}${tags}\n  Situation: ${s.situation}\n  Action: ${s.action}\n  Result: ${s.result}`
  }).join('\n\n')
  return `\n\nINTERVIEW STORIES (candidate-verified, treat as authoritative)\nFor each question in Likely Questions, identify which story below best answers it and reference it explicitly in the answer frame.\n${lines}`
}

function formatInterviewLogs(logs: InterviewLogRow[]): string {
  return logs.map(log => {
    const header = [log.interview_stage, log.interview_date].filter(Boolean).join(' - ')
    const parts: string[] = header ? [header] : []
    if (log.questions_asked) parts.push(`Questions asked: ${log.questions_asked}`)
    if (log.what_landed) parts.push(`What landed: ${log.what_landed}`)
    if (log.what_surprised) parts.push(`What surprised me: ${log.what_surprised}`)
    if (log.follow_up_needed) parts.push(`Follow-up needed: ${log.follow_up_needed}`)
    return parts.join('\n')
  }).join('\n\n')
}

function buildSignalFocusHints(signals: Signal[] | null): string {
  if (!(signals ?? []).length) return ''

  const topTypes = Array.from(new Set((signals ?? []).map(s => s.signal_type))).slice(0, 6)
  const typeList = topTypes.join(', ')

  return `

SIGNAL-TO-FOCUS INFERENCE INSTRUCTION
Recent company signals are listed above. Infer the 2-3 most likely current company focus areas and use them to shape the brief.
- If filings, board, or governance signals appear, infer governance, compliance, or capital-allocation focus.
- If partnership, acquisition, expansion, or product signals appear, infer growth, integration, or go-to-market focus.
- If executive departures or hires appear, infer leadership-change and mandate-reset focus.
Do not claim certainty. Phrase as likely focus areas supported by available evidence.
In Anticipated Pushback, the first objection should reflect the highest-probability focus/risk inferred from these signals.
Signal categories detected: ${typeList}.`
}

function buildContext(company: CompanyRow, profile: ProfileRow | null, scanResults: ScanRow[] | null, contacts: ContactRow[] | null, documents: DocRow[] | null, signals: Signal[] | null, interviewStage: InterviewStage | null = null, interviewLogs: InterviewLogRow[] | null = null, roleMode: PrepRoleMode | null = null) {
  const name = profile?.full_name ?? 'the candidate'
  const targetTitles = (profile?.target_titles ?? []).join(', ') || 'Not specified'
  const targetSectors = (profile?.target_sectors ?? []).join(', ') || 'Not specified'

  const scanSection = buildScanSection(scanResults, profile?.role_type)
  const signalSection = buildSignalSection(signals)
  const focusBrief = buildCompanyFocusBrief(signals)
  const contactSection = buildContactSection(contacts)
  const hasContacts = (contacts ?? []).length > 0
  const docsSection = buildDocSection(documents)
  const hasJobDescription = (documents ?? []).some(d => d.label === 'job_description')
  const signalFocusHints = buildSignalFocusHints(signals)

  function careerSection(p: ProfileRow | null): string {
    if (!p) return ''
    const entries = Array.isArray(p.career_history_json) ? (p.career_history_json as CareerEntry[]) : null
    if (entries && entries.length > 0) {
      const lines = entries.map(e => {
        const dates = `${e.start_year || '?'} to ${e.end_year || 'present'}`
        const company = e.parent_company ? `${e.company} (${e.parent_company})` : e.company
        const note = e.acquisition_note ? `\n  Context: ${e.acquisition_note}` : ''
        return `${company} | ${e.title} | ${dates}\n  ${e.key_outcome}${note}`
      }).join('\n\n')
      return `\n[Verified career history, confirmed by the executive. Treat as authoritative. Do not infer or contradict these entries.]\n${lines}`
    }
    return p.resume_text ? `\nResume / career history:\n${p.resume_text.slice(0, RESUME_CHARS)}` : ''
  }

  const companySizeLabel: Record<string, string> = {
    startup: 'Startup (under 200 employees)',
    midmarket: 'Mid-Market (200-2,000 employees)',
    enterprise: 'Enterprise (2,000+ employees)',
  }

  const stageCtx = interviewStageContext(interviewStage, profile?.role_type)

  const prompt = `Prepare an elite pre-interview brief for the following situation. This is the level of preparation a top executive coach produces: specific, direct, and grounded in the actual data below.${stageCtx}

CANDIDATE
Name: ${name}${profile?.current_title ? `\nCurrent/recent title: ${profile.current_title}` : ''}${profile?.current_company ? `\nCurrent/recent company: ${profile.current_company}` : ''}${personaContext(profile?.search_persona)}${roleTypeContext(profile?.role_type)}${transitionModeContext(profile?.search_persona, profile?.target_titles, profile?.role_type)}
Target roles: ${targetTitles}
Target sectors: ${targetSectors}${profile?.positioning_summary ? `\nPositioning: ${profile.positioning_summary}` : ''}${careerSection(profile)}${buildRoleSpecificContext(profile)}${profile?.beyond_resume ? `\nBeyond the resume: ${profile.beyond_resume}` : ''}${buildStarStoriesSection(profile)}${buildSearchIntakeSection(profile?.role_context)}

COMPANY
Name: ${company.name}${company.sector ? `\nSector: ${company.sector}` : ''}${company.company_size ? `\nCompany size: ${companySizeLabel[company.company_size] ?? company.company_size}` : ''}
Pipeline stage: ${company.stage}${company.notes ? `\nIntel and notes: ${company.notes}` : ''}${company.competitive_context ? `\nCompetitive field: ${company.competitive_context}` : ''}${company.competitive_context ? `

COMPETITIVE POSITIONING INSTRUCTION
The candidate is competing against the field described above. Every section of this brief must reflect this.
Win Thesis: name the decisive advantage over the specific alternatives described. If internal candidates are mentioned, the Win Thesis must explicitly frame what an external perspective provides that an insider cannot. If specific firms or backgrounds are named, the Win Thesis must address why this candidate wins that comparison.
Anticipated Pushback: the first or second objection must be the competitive comparison most likely to be raised in the room. State it directly and give the exact counter.
Do not soften or genericize the competitive framing. Write as if the interviewer already has the other candidate's resume in front of them.` : ''}

${(company.interview_notes || (interviewLogs ?? []).length > 0) ? `PRIOR INTERVIEW NOTES
These are the candidate's own notes from prior conversations at this company. Treat as authoritative first-person reporting.
${(interviewLogs ?? []).length > 0 ? `\nSTRUCTURED SESSION LOG\n${formatInterviewLogs(interviewLogs!)}` : ''}${company.interview_notes ? `\nFREE-FORM NOTES\n${company.interview_notes}` : ''}

PRIOR INTERVIEW NOTES INSTRUCTION
These notes change the brief in specific ways:
- Any objection raised in a prior conversation becomes the first item in Anticipated Pushback, with a stronger and more specific counter than whatever they used before.
- Likely Questions must reflect what was actually asked, weighted ahead of what might be asked.
- Win Thesis must directly address anything that caused hesitation or uncertainty in a prior conversation.
- Amplify what landed well. Build more of the brief around it.
- If the notes mention something the interviewer emphasized or cared about, surface it prominently.

` : ''}JOB SCAN DATA
${scanSection}
${signalSection ? `\nCOMPANY SIGNALS (recent news events)\n${signalSection}` : ''}
${focusBrief ? `\nCOMPANY FOCUS BRIEF (inferred from signals)\n${focusBrief}` : ''}
${signalFocusHints}

KNOWN CONTACTS
${contactSection}${docsSection ? `\n\nDOCUMENTS\n${docsSection}` : ''}

${hasJobDescription ? `JOB DESCRIPTION USAGE INSTRUCTION
At least one job description is available in documents. Treat it as primary evidence for role requirements.
- Extract the 5-7 highest-signal requirements that will determine selection in this role.
- Map those requirements to the candidate's verified history and STAR stories where possible.
- In Anticipated Pushback and Likely Questions, prioritize probes directly implied by the job description.
- In What to Leave Out, explicitly remove stories that do not support the top requirements.
Do not copy/paste the job description. Translate it into interview strategy.` : ''}

---

Write the brief with these exact sections, using ## for each header:

EXECUTION STYLE INSTRUCTION
- Keep every answer manager-practical: name decision owner, operating cadence, and measurable follow-up.
- Lead with the recommendation first, then supporting context.
- Use operating language, not abstractions: who does what by when, and what metric proves it worked.

## Bottom Line
Three sentences only. No preamble, no company context, no hedging. The first states the candidate's single decisive advantage for this role: what specifically makes them the hire over everyone else being considered. The second names the most dangerous objection they will face: the one that, if not addressed, loses them the offer. The third states the single thing they must do or say in this conversation to close it. If they read nothing else, these three sentences are everything they need to walk in. Commit fully.

## The Situation
What is actually driving this hire? What problem does this organization need solved, and why now? Infer from the sector, pipeline stage, notes, and scan data. Be direct. This sets the frame for everything else.

## Win Thesis
One paragraph. Written as a conviction, not a summary. Not why the candidate is qualified, but why they win this specific role over everyone else being considered. What is the decisive advantage. Make the candidate feel it.

${hasJobDescription ? `## Role Requirement to Evidence Map
List the top 5-7 requirements inferred from the job description in priority order. For each:
**Requirement:** [specific requirement in plain language]
**Candidate evidence:** [specific proof from verified career history, STAR story, or positioning]
**Coverage:** [Strong / Partial / Weak]
Use this section to force specificity. Do not leave this generic.` : ''}

## Stakeholder Signal Map
Map the interview strategy by interviewer type using this exact structure:
**Stakeholder:** [CEO / Board / Functional Peer / Recruiter]
**What they need to believe:** [one sentence]
**Signal they are looking for:** [specific behavior or proof]
**Failure signal:** [what causes concern]
**Your move:** [exact positioning move in this room]
Prioritize the 2 stakeholder types most likely in this stage, then include the others briefly.

## 12-Month Performance Outcomes
Define 4-6 measurable outcomes this role is likely accountable for in the first 12 months. For each:
**Outcome:** [what must be true by month 12]
**Metric:** [how success is measured]
**Candidate proof:** [which career evidence best supports this outcome]
Make this role-specific and company-specific, not generic executive goals.

## The Narrative
How to tell their story for THIS room. Which chapters of their background to lead with, which to compress, which to leave out entirely. Close with one specific through-line sentence they can use as their opening positioning statement, ready to say verbatim.

## Anticipated Pushback
The 3–4 most likely objections or challenges this candidate will face. Order by lethality: the objection most likely to kill the candidacy goes first. For each, state the objection directly and give the exact counter. Format each as:
**They push:** [the objection]
**You say:** [specific counter, not defensive, not vague]

## Board Challenge Drill
Provide exactly 6 hard boardroom-style challenges and response frames using this exact set:
1) Risk exposure
2) Missed quarter
3) Transformation ROI
4) Security incident response
5) Leadership bench
6) Capital allocation
For each use this structure:
**Challenge:** [the question stated as a direct board challenge]
**What they are testing:** [one sentence]
**Decision-right owner:** [who owns the decision and accountability in this scenario]
**Strong response frame:** [recommendation first, then evidence, then execution signal]
**Execution proof line:** [one line naming owner, cadence, and metric]

## 2-Sentence Pivot Bank
Provide 8 short interruption-ready pivots for hostile reframes or abrupt interviewer redirects.
Each pivot must be exactly two sentences:
- Sentence 1 acknowledges or reframes the interruption.
- Sentence 2 lands one decision, one metric, and one next action.
Format each as:
**Interruption scenario:** [what they cut in with]
**Pivot:** [sentence 1] [sentence 2]

## Crisis-to-Credible Framework
Give a reusable answer scaffold for high-pressure recovery questions. Use this exact sequence:
**What happened:** [crisis facts and scope]
**What you changed:** [specific operating changes made]
**How you measured recovery:** [metrics, baselines, and recovery threshold]
**What governance you put in place:** [owner, review cadence, escalation path]
Then add one 6-8 sentence sample answer using this sequence in plain executive language.

## Likely Questions
The 4–5 questions this interviewer will almost certainly ask, derived from the intersection of this specific role, this company's situation, and this candidate's background. Not generic behavioral questions: questions that arise because of who this person is and what this company needs right now. For each:
**They ask:** [the question, phrased as they would actually say it]
**What they're probing:** [what is actually being tested underneath the question, one sentence]
**Strong answer frame:** [how to approach it: what to lead with, what to include, what to avoid, 2–3 sentences. The structure of a strong answer, not the answer itself]
Optional: include one time-box answer variants line when useful:
**Time-box variants (optional):** [30 seconds: core answer] [60 seconds: recommendation plus proof] [2 minutes: recommendation, context, execution detail, and measurable follow-up]

## Behavioral Rehearsal Scorecard
For the top 4 likely questions, provide a rehearsal rubric:
**Question:** [reference the likely question]
**Substance bar (1-5):** [what a 5/5 answer includes]
**Structure bar (1-5):** [what organized executive-level structure looks like]
**Signal bar (1-5):** [what confidence/ownership signal interviewers need]
**Common failure mode:** [where senior interviewers lose interest]
**Upgrade move:** [one concrete edit to improve answer quality]

## Talking Points
5 specific, story-anchored points to make in the interview. Order by impact: the strongest, most differentiating point goes first. Each must connect an element of the candidate's actual background to this company's specific situation. Not generic strengths. Points that land in this room. Format:
**[Point title]** [2–3 sentences: what to say and exactly why it resonates here]

## Questions to Ask
5 questions that signal the candidate is a strategic peer, not an applicant. Lead with the single question most likely to distinguish this candidate from everyone else in the room. Each should demonstrate a specific kind of executive intelligence. After each question, one sentence on what it signals to the interviewers.

## First 90 Days Signal
2–3 specific observations or priorities to surface naturally in conversation, not as a formal plan, but as proof the candidate has already started thinking like an insider. Phrase each as something they'd actually say in the room, then note why it lands.

## What to Leave Out
3–4 explicit topics, framings, or stories to avoid in this specific conversation, and why each would hurt them here. Be direct.

## How to Close
What to do and say in the final 3–5 minutes of this specific conversation. Three elements, each ready to use verbatim or near-verbatim:

**Express interest:** One or two sentences that state genuine interest in this role without hedging or desperation. Calibrate to who is in the room: the language a CEO uses closing with a board chair is different from what a VP uses closing with a recruiter.

**Ask about process:** One sentence that asks about next steps as a peer, not an applicant. No anxiety. No "so what are my chances." Phrase it as someone who assumes they are a serious candidate.

**Final impression:** The one thought to leave them with in the last 30 seconds. What to say, reference, or do so they are still thinking about this candidate after the call ends.

## Reading the Room
How to interpret the signals at the end of this specific conversation. Cover the 3–4 most likely signal patterns given this company, this role, and this candidate's situation. For each:
**Signal:** [what they observe: specific language, behavior, or energy shift]
**What it means:** [the real interpretation, one sentence, no hedging]
**Your move:** [what to do within the next 24 hours in response]

Include at least one strong positive signal and one soft negative signal. Be specific to this type of organization and seniority level, not generic interview advice.${hasContacts ? '\n\n## People\nFor each known contact: when to surface the name, how to frame the relationship, and what it signals to the room.' : ''}

## Weekly Drill Cadence (7-day execution plan)
Create a one-week prep cadence with explicit daily reps and outputs.
- Day 1: requirement mapping and opening narrative draft
- Day 2: objection drills and counter positioning
- Day 3: behavioral rehearsal with scoring
- Day 4: technical/case or role-specific depth rehearsal
- Day 5: stakeholder-specific close rehearsal
- Day 6: full mock loop and red-team stress test
- Day 7: final polish and interview-day briefing
For each day include: time budget, exact deliverable, and pass/fail check.

If the candidate's background is thin (no resume, no positioning), name what you cannot assess rather than generating generic advice. Tell them exactly what to provide for a sharper brief. Do not invent specifics or use vague generalities to cover missing data.

Tone: direct, senior-to-senior. Short paragraphs. No em dashes. No hedging. No motivational language.`

  return prompt + getRoleModePromptPack(roleMode)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requirePrepAccess(request)
  if (!access.ok) return access.response
  const { userId, tier, supabase } = access
  const model = getModelForTier(tier)

  const routeParams = PrepRouteParamsSchema.safeParse(await params)
  if (!routeParams.success) {
    return apiError(firstZodError(routeParams.error), 400)
  }

  const queryParsed = PrepGenerateQuerySchema.safeParse({
    posting_url: request.nextUrl.searchParams.get('posting_url') ?? undefined,
    interview_stage: request.nextUrl.searchParams.get('interview_stage') ?? null,
    role_mode: request.nextUrl.searchParams.get('role_mode') ?? null,
  })
  if (!queryParsed.success) {
    return apiError(firstZodError(queryParsed.error), 400)
  }

  const { id: companyId } = routeParams.data
  const { company, profile, scanResults, contacts, documents, signals, interviewLogs } = await loadContext(supabase, companyId, userId)

  if (!company) return apiError('Not found', 404)

  if (isDemoUser(userId)) {
    const key = company.name.toLowerCase()
    const demoContent = DEMO_PREP_BRIEFS[key]
    if (demoContent) {
      return new Response(streamDemoText(demoContent), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }
  }

  const postingUrl = queryParsed.data.posting_url || null
  const interviewStage = normalizeInterviewStage(queryParsed.data.interview_stage)
  const rawRoleMode = queryParsed.data.role_mode ?? null
  const roleMode = isPrepRoleMode(rawRoleMode) ? rawRoleMode : null
  let allDocuments = documents
  if (postingUrl && !isAllowedJobUrl(postingUrl)) {
    return apiError('Invalid posting URL', 400)
  }
  if (postingUrl) {
    try {
      const html = await fetch(postingUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(8000),
      }).then(r => r.text())
      const text = extractTextFromHtml(html).slice(0, 6000)
      if (text.length > 100) {
        allDocuments = [{ label: 'job_description', content: text }, ...(documents ?? [])]
      }
    } catch { /* ignore fetch errors, fall back to existing docs */ }
  }

  const userPrompt = buildContext(company, profile as ProfileRow | null, scanResults, contacts, allDocuments, signals, interviewStage, interviewLogs as InterviewLogRow[] | null, roleMode)

  const attributionContextIds = [
    (profile?.career_history_json ? 'ctx_career_history' : null),
    (profile?.resume_text ? 'ctx_resume_text' : null),
    (profile?.star_stories ? 'ctx_star_story' : null),
    ((signals?.length ?? 0) > 0 ? 'ctx_company_signals' : null),
    ((scanResults?.length ?? 0) > 0 ? 'ctx_scan_results' : null),
    (company.notes ? 'ctx_company_notes' : null),
    (((interviewLogs?.length ?? 0) > 0 || company.interview_notes) ? 'ctx_interview_notes' : null),
    ((contacts?.length ?? 0) > 0 ? 'ctx_contact_records' : null),
    ((allDocuments?.length ?? 0) > 0 ? 'ctx_company_documents' : null),
    ((allDocuments ?? []).some((doc) => doc.label === 'job_description') ? 'ctx_job_description' : null),
  ].filter((id): id is string => Boolean(id))

  const readable = makeStream(
    [{ role: 'user', content: userPrompt }],
    16000, // the brief template spans ~20 sections; 8000 truncated at the cap in production
    supabase,
    userId,
    model,
    {
      feature: 'prep_brief',
      inputSnapshot: {
        company_name: company.name,
        company_stage: company.stage,
        interview_stage: interviewStage,
        role_mode: roleMode,
        has_resume: (profile?.resume_text?.length ?? 0) > 0,
        has_scan: (scanResults?.length ?? 0) > 0,
      },
    }
  )

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'x-prep-attribution-context-ids': JSON.stringify(attributionContextIds),
    },
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requirePrepAccess(request)
  if (!access.ok) return access.response
  const { userId, tier, supabase } = access
  const model = getModelForTier(tier)

  const routeParams = PrepRouteParamsSchema.safeParse(await params)
  if (!routeParams.success) {
    return apiError(firstZodError(routeParams.error), 400)
  }

  let raw: unknown
  try { raw = await request.json() } catch {
    return apiError('Invalid JSON', 400)
  }
  const parsed = PrepRefineBodySchema.safeParse(raw)
  if (!parsed.success) {
    return apiError(firstZodError(parsed.error), 400)
  }
  const { brief, request: refinementRequest } = parsed.data

  if (isDemoUser(userId)) {
    return new Response(streamDemoText(brief), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const readable = makeStream(
    [
      {
        role: 'user',
        content: `Here is the current interview prep brief:\n\n${brief}\n\n---\n\nModification request: ${refinementRequest}\n\nReturn the complete updated brief incorporating this change precisely. Keep all ## section headers. Maintain the same direct, senior-to-senior tone. No em dashes. No motivational language.`,
      },
    ],
    16000, // refine rewrites the full brief; 6000 guaranteed truncation
    supabase,
    userId,
    model,
    { feature: 'prep_refine', inputSnapshot: { refine_request: refinementRequest.slice(0, 100) } }
  )

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
