import { type NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireFeatureAccess } from '@/lib/require-feature-access'
import { trackApiUsage } from '@/lib/api-usage'
import { anthropic, MODELS } from '@/lib/anthropic'
import { STRATEGY_SYSTEM, personaContext } from '@/lib/prompts'
import { RESUME_CHARS } from '@/lib/ai-limits'
import { isDemoUser, streamDemoText, DEMO_STRATEGY_BRIEF } from '@/lib/demo'
import { streamErrorMessage } from '@/lib/stream-error'
import { recordTraceError } from '@/lib/trace'
import { encodeUserId } from '@/lib/watermark'
import { type SupabaseClient } from '@supabase/supabase-js'

type SearchIntake = {
  search_stage?: string | null
  transition_type?: string | null
  urgency?: string | null
  target_companies?: string[] | null
  company_size_stage?: string | null
  geography?: string | null
  remote_travel?: string | null
  comp_guardrails?: string | null
  search_hypothesis?: string | null
  roles_to_avoid?: string[] | null
  culture_criteria?: string | null
  red_flags?: string[] | null
  decision_criteria?: string[] | null
  board_visibility?: string | null
  stakeholder_complexity?: string | null
  relationship_targets?: string[] | null
  partner_notes?: string | null
  coach_name?: string | null
}

function buildSearchIntakeSection(roleContext: unknown): string {
  const intake = (roleContext as Record<string, unknown> | null | undefined)?.search_intake as SearchIntake | undefined
  if (!intake) return ''
  const line = (label: string, value?: string | null) => (value ? `\n${label}: ${value}` : '')
  const list = (label: string, values?: string[] | null) => (values?.length ? `\n${label}: ${values.join(', ')}` : '')
  const body =
    line('Transition type', intake.transition_type) +
    line('Search stage', intake.search_stage) +
    line('Urgency / timing', intake.urgency) +
    line('Search hypothesis', intake.search_hypothesis) +
    list('Named target companies', intake.target_companies) +
    line('Company size / stage preference', intake.company_size_stage) +
    line('Geography', intake.geography) +
    line('Remote / travel constraints', intake.remote_travel) +
    line('Compensation guardrails', intake.comp_guardrails) +
    list('Roles to avoid', intake.roles_to_avoid) +
    line('Culture criteria', intake.culture_criteria) +
    list('Red flags', intake.red_flags) +
    list('Decision criteria', intake.decision_criteria) +
    line('Board visibility preference', intake.board_visibility) +
    line('Stakeholder complexity', intake.stakeholder_complexity) +
    list('Relationships to activate', intake.relationship_targets) +
    line('Coach / partner', intake.coach_name) +
    line('Coach notes', intake.partner_notes)
  if (!body) return ''
  return `\n\nSEARCH INTAKE (the candidate's stated decision rules. Honor roles to avoid, decision criteria, and red flags when assessing fit and recommending targets.)${body}`
}

function makeStream(prompt: string, supabase: SupabaseClient, userId: string) {
  const encoder = new TextEncoder()
  return new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: MODELS.opus,
          max_tokens: 4000,

          system: STRATEGY_SYSTEM,
          messages: [{ role: 'user', content: prompt }],
        })
        stream.on('text', text => controller.enqueue(encoder.encode(text)))
        const final = await stream.finalMessage()
        controller.enqueue(encoder.encode(encodeUserId(userId)))
        controller.close()
        const tokens = (final.usage.input_tokens ?? 0) + (final.usage.output_tokens ?? 0)
        trackApiUsage(supabase, userId, tokens).catch(err => Sentry.captureException(err, { extra: { route: 'strategy', userId } }))
      } catch (err) {
        recordTraceError({ feature: 'strategy_brief', userId, error: err instanceof Error ? err.message : String(err) })
        controller.enqueue(encoder.encode(streamErrorMessage(err, { feature: 'strategy_brief', userId })))
        controller.close()
      }
    },
  })
}

export async function GET(request: NextRequest) {
  const access = await requireFeatureAccess(request, 'strategy_brief')
  if (!access.ok) return access.response

  if (request.nextUrl.searchParams.get('monitor') === '1') {
    return NextResponse.json({ ok: true, mode: 'monitor' }, { status: 202 })
  }

  const { userId, supabase } = access

  const [{ data: profile }, { data: companies }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('full_name, current_title, current_company, target_titles, target_sectors, target_locations, positioning_summary, resume_text, beyond_resume, search_status, search_persona, role_context')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('companies')
      .select('name, sector, stage')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('fit_score', { ascending: false, nullsFirst: false })
      .limit(20),
  ])

  const name = profile?.full_name ?? 'the candidate'
  const targetTitles = (profile?.target_titles ?? []).join(', ') || 'Not specified'
  const targetSectors = (profile?.target_sectors ?? []).join(', ') || 'Not specified'
  const targetLocations = (profile?.target_locations ?? []).join(', ') || 'Not specified'

  const pipelineSection = (companies ?? []).length > 0
    ? (companies ?? []).map(c => `- ${c.name}${c.sector ? ` (${c.sector})` : ''}: ${c.stage}`).join('\n')
    : 'No target companies added yet.'

  const prompt = `Produce a Search Strategy Brief for this executive. This is what you say in the first real meeting: honest, specific, direct.

CANDIDATE
Name: ${name}${profile?.current_title ? `\nCurrent/recent title: ${profile.current_title}` : ''}${profile?.current_company ? `\nCurrent/recent company: ${profile.current_company}` : ''}${personaContext(profile?.search_persona)}
Target roles: ${targetTitles}
Target sectors: ${targetSectors}
Target locations: ${targetLocations}${profile?.search_status ? `\nSearch status: ${profile.search_status}` : ''}${profile?.positioning_summary ? `\nSelf-positioning: ${profile.positioning_summary}` : ''}${profile?.resume_text ? `\nResume / career history:\n${profile.resume_text.slice(0, RESUME_CHARS)}` : ''}${profile?.beyond_resume ? `\nBeyond the resume: ${profile.beyond_resume}` : ''}${buildSearchIntakeSection(profile?.role_context)}

CURRENT PIPELINE (${(companies ?? []).length} companies)
${pipelineSection}

---

Write the brief with these exact sections, using ## for each header:

## Bottom Line
Three sentences only. No preamble. The first names this candidate's single decisive advantage in this search right now: what specifically makes them a compelling hire at this moment. The second names the single biggest risk or gap: the thing that, if unaddressed, will cost them the best opportunities. The third states the one move that will most accelerate their search in the next 30 days. If they read only this section, these three sentences are everything. No hedging. No qualifications. Commit.

## Your Position
Open with a single verdict sentence: where this person actually stands in the market right now, stated plainly. Then the supporting evidence: what's working in their favor, what's working against them, and what the market looks like for their profile. Include whether the stated target roles are realistic, stretchy, or off-base. Not encouragement: a real assessment.

## Target Role Profile
Primary target titles to pursue. 2–3 adjacent alternatives worth considering that they may not have thought of. Explain why each is a legitimate fit and where the opportunity surface is. Flag any titles they listed that are likely to be low-yield and why.

## Target Company Profile
What kinds of organizations are most likely to hire them. Size, stage, ownership structure, sector priorities. Where the realistic opportunity surface actually is at their level versus where candidates at this level typically waste time.

## Your Narrative
The core story they need to tell. One clear through-line that explains the arc of their career and why this search makes sense. What to lead with in every conversation, what to compress, what to leave out. Close with one sentence they can open every conversation with, something they can say verbatim.

## Outreach Framework
How to actually work this search. Specific breakdown of where to focus across: warm network, cold outreach, executive recruiters/search firms, and direct approach. What works at this level and what doesn't. One specific tactic for each channel.

## Gaps to Get Ahead Of
2–3 objections or gaps they will face repeatedly. Order by severity: the gap most likely to cost them the best opportunity goes first. For each, state what it is directly and give the specific framing or counter. These are the things that will kill their candidacy if not addressed proactively.

## First 30 Days
8–10 concrete actions in priority order. The first action is the single highest-leverage move available right now. Not strategy: specific moves. Each should be completable in the next month. Format each as an action, not a principle.

If critical information is absent (no resume, no current role, no target titles), name the gap explicitly in the relevant section rather than filling it with generic advice. Tell the reader exactly what you cannot assess and what they would need to provide to get a sharper answer. Do not invent details or speak in vague generalities to cover missing data.

Tone: direct, senior-to-senior, no hedging. Short paragraphs. No em dashes. No motivational language. No generic advice.`

  if (isDemoUser(userId)) {
    return new Response(streamDemoText(DEMO_STRATEGY_BRIEF), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const readable = makeStream(prompt, supabase, userId)

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
