import * as Sentry from '@sentry/nextjs'
import { type NextRequest, NextResponse } from 'next/server'
import { requireFeatureAccess } from '@/lib/require-feature-access'
import { createClient } from '@/lib/supabase/server'
import { todayInTz, fullDateInTz } from '@/lib/date'
import { trackApiUsage, trimMessages } from '@/lib/api-usage'
import { isDemoUser } from '@/lib/demo'
import { streamErrorMessage } from '@/lib/stream-error'
import Anthropic from '@anthropic-ai/sdk'
import { anthropic, MODELS, withStreamTimeout } from '@/lib/anthropic'
import { buildChatSystemPrompt } from '@/lib/prompts'
import { ChatBodySchema, firstZodError } from '@/lib/schemas'
import { recordTrace, recordTraceError } from '@/lib/trace'
import { checkRateLimit } from '@/lib/rate-limit'
const MAX_TOOL_ROUNDS = 5

type ToolInput = Record<string, string>

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'update_company_stage',
    description: "Move a company in the user's pipeline to a new stage. Use when the user asks to update, move, or change the status of a company.",
    input_schema: {
      type: 'object' as const,
      properties: {
        company_name: { type: 'string', description: 'Company name as shown in the pipeline' },
        stage: {
          type: 'string',
          enum: ['watching', 'researching', 'applied', 'interviewing', 'offer'],
          description: "New pipeline stage. 'applied' displays as 'In Process' in the UI.",
        },
      },
      required: ['company_name', 'stage'],
    },
  },
  {
    name: 'add_follow_up',
    description: 'Create a follow-up action item. Use when the user asks to schedule a follow-up, set a reminder, or log a next action.',
    input_schema: {
      type: 'object' as const,
      properties: {
        action: { type: 'string', description: 'What action to take' },
        due_date: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
        company_name: { type: 'string', description: 'Optional: company name to link this follow-up to' },
      },
      required: ['action', 'due_date'],
    },
  },
  {
    name: 'update_company_notes',
    description: 'Update the notes for a company. Use when the user shares information about a company (calls, context, key facts, what was discussed).',
    input_schema: {
      type: 'object' as const,
      properties: {
        company_name: { type: 'string', description: 'Company name as shown in the pipeline' },
        notes: { type: 'string', description: 'New notes content (replaces existing notes)' },
      },
      required: ['company_name', 'notes'],
    },
  },
  {
    name: 'lookup_contacts',
    description: "Look up contacts at a specific company, or get all contacts. Use when the user asks who they know at a company or asks about their network.",
    input_schema: {
      type: 'object' as const,
      properties: {
        firm: { type: 'string', description: 'Company/firm name to filter by. Use empty string to get all contacts.' },
      },
      required: ['firm'],
    },
  },
]

async function runTool(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  toolName: string,
  input: ToolInput
): Promise<{ result: string; label: string }> {
  switch (toolName) {
    case 'update_company_stage': {
      const { data: rows } = await supabase
        .from('companies')
        .select('id, name')
        .eq('user_id', userId)
        .is('archived_at', null)
        .ilike('name', `%${input.company_name}%`)
        .limit(1)
      if (!rows?.length) return { result: `No company found matching "${input.company_name}"`, label: `Could not find "${input.company_name}"` }
      const c = rows[0]
      await supabase.from('companies').update({ stage: input.stage }).eq('id', c.id).eq('user_id', userId)
      const stageLabel = input.stage.replace('_', ' ')
      const label = `Moved ${c.name} to ${stageLabel}`
      return { result: label, label }
    }

    case 'add_follow_up': {
      let companyId: string | null = null
      if (input.company_name) {
        const { data: rows } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', userId)
          .ilike('name', `%${input.company_name}%`)
          .limit(1)
        companyId = rows?.[0]?.id ?? null
      }
      await supabase.from('follow_ups').insert({
        user_id: userId,
        action: input.action,
        due_date: input.due_date,
        company_id: companyId,
        status: 'pending',
      })
      const label = `Added follow-up: "${input.action}" (due ${input.due_date})`
      return { result: label, label }
    }

    case 'update_company_notes': {
      const { data: rows } = await supabase
        .from('companies')
        .select('id, name')
        .eq('user_id', userId)
        .ilike('name', `%${input.company_name}%`)
        .limit(1)
      if (!rows?.length) return { result: `No company found matching "${input.company_name}"`, label: `Could not find "${input.company_name}"` }
      const c = rows[0]
      await supabase.from('companies').update({ notes: input.notes }).eq('id', c.id).eq('user_id', userId)
      const label = `Updated notes for ${c.name}`
      return { result: label, label }
    }

    case 'lookup_contacts': {
      let query = supabase
        .from('contacts')
        .select('name, title, firm, channel, status')
        .eq('user_id', userId)
        .eq('status', 'active')
      if (input.firm) {
        query = query.ilike('firm', `%${input.firm}%`)
      }
      const { data: rows } = await query.order('name').limit(20)
      if (!rows?.length) {
        const msg = input.firm ? `No contacts at "${input.firm}"` : 'No contacts in your tracker yet'
        return { result: msg, label: input.firm ? `Checked contacts at ${input.firm}` : 'Checked all contacts' }
      }
      const lines = rows.map(r =>
        `${r.name}${r.title ? ` (${r.title})` : ''}${r.firm ? ` at ${r.firm}` : ''}${r.channel ? ` via ${r.channel}` : ''}`
      )
      const label = input.firm ? `Looked up contacts at ${input.firm}` : 'Looked up all contacts'
      return { result: lines.join('\n'), label }
    }

    default:
      return { result: 'Unknown tool', label: 'Unknown action' }
  }
}

export async function POST(request: NextRequest) {
  const access = await requireFeatureAccess(request, 'ai_chat')
  if (!access.ok) return access.response

  const { userId, supabase } = access

  const { allowed, retryAfter } = await checkRateLimit(userId)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests - slow down and try again shortly' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = ChatBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 })
  }
  const trimmed = trimMessages(parsed.data.messages)

  const [{ data: profile }, { data: companies }, { data: contacts }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('full_name, briefing_timezone, current_title, target_titles, target_sectors, positioning_summary, search_persona')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('companies')
      .select('name, stage, fit_score, sector, notes')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('fit_score', { ascending: false, nullsFirst: false }),
    supabase
      .from('contacts')
      .select('name, title, firm, channel')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('name')
      .limit(50),
  ])

  const tz = profile?.briefing_timezone ?? 'UTC'
  const name = profile?.full_name?.split(' ')[0] ?? 'there'
  const today = fullDateInTz(tz)

  const { data: followUps } = await supabase
    .from('follow_ups')
    .select('action, due_date, companies(name)')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .lte('due_date', todayInTz(tz))
    .order('due_date', { ascending: true })

  const pipelineLines = (companies ?? [])
    .map(c =>
      `- ${c.name} | ${c.stage}${c.fit_score ? ` | fit: ${c.fit_score}/10` : ''}${c.sector ? ` | ${c.sector}` : ''}${c.notes ? ` | notes: ${c.notes}` : ''}`
    )
    .join('\n')

  const actionsLines = (followUps ?? [])
    .map(fu => {
      const co = fu.companies as unknown as { name: string } | null
      return `- ${fu.action}${co ? ` (${co.name})` : ''}, due ${fu.due_date}`
    })
    .join('\n')

  const contactLines = (contacts ?? [])
    .map(c =>
      `- ${c.name}${c.title ? ` (${c.title})` : ''}${c.firm ? ` at ${c.firm}` : ''}${c.channel ? ` | ${c.channel}` : ''}`
    )
    .join('\n')

  const profileLines = [
    profile?.current_title ? `Current: ${profile.current_title}` : null,
    profile?.target_titles?.length ? `Target roles: ${(profile.target_titles as string[]).join(', ')}` : null,
    profile?.target_sectors?.length ? `Target sectors: ${(profile.target_sectors as string[]).join(', ')}` : null,
    profile?.positioning_summary ? `Positioning: ${profile.positioning_summary}` : null,
    profile?.search_persona === 'csuite' ? 'Level: C-Suite' : profile?.search_persona === 'vp' ? 'Level: VP / SVP' : profile?.search_persona === 'board' ? 'Level: Board / Advisor' : null,
  ].filter(Boolean).join('\n')

  const isDemo = isDemoUser(userId)

  const systemPrompt = buildChatSystemPrompt({
    name,
    today,
    isDemo,
    profileLines,
    pipelineLines,
    contactLines,
    actionsLines,
    companiesCount: (companies ?? []).length,
    contactsCount: (contacts ?? []).length,
  })

  const encoder = new TextEncoder()
  let totalTokens = 0
  const startMs = Date.now()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        type WorkingMessage = Anthropic.MessageParam
        let workingMessages: WorkingMessage[] = trimmed.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))

        await withStreamTimeout(90_000, async (signal) => {
        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const stream = anthropic.messages.stream({
            model: MODELS.sonnet,
            max_tokens: 1024,
            system: systemPrompt,
            tools: isDemo ? [TOOLS[3]] : TOOLS,
            messages: workingMessages,
          }, { signal })

          stream.on('text', text => {
            controller.enqueue(encoder.encode(text))
          })

          const response = await stream.finalMessage()
          totalTokens += (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0)

          if (response.stop_reason !== 'tool_use') {
            controller.close()
            trackApiUsage(supabase, userId, totalTokens).catch(err => Sentry.captureException(err, { extra: { route: 'chat', userId } }))
            recordTrace({
              supabase, userId, feature: 'chat', model: MODELS.sonnet,
              promptTokens: response.usage.input_tokens ?? 0,
              completionTokens: response.usage.output_tokens ?? 0,
              latencyMs: Date.now() - startMs,
              inputSnapshot: { message_count: trimmed.length, rounds: round + 1 },
            })
            return
          }

          const toolResults: Anthropic.ToolResultBlockParam[] = []

          for (const block of response.content) {
            if (block.type !== 'tool_use') continue
            const { result, label } = await runTool(supabase, userId, block.name, block.input as ToolInput)
            toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })
            controller.enqueue(encoder.encode(`[ACTION:${label}]\n`))
          }

          workingMessages = [
            ...workingMessages,
            { role: 'assistant', content: response.content as unknown as Anthropic.MessageParam['content'] },
            { role: 'user', content: toolResults },
          ]
        }

        controller.close()
        trackApiUsage(supabase, userId, totalTokens).catch(err => Sentry.captureException(err, { extra: { route: 'chat', userId } }))
        }) // end withStreamTimeout
      } catch (err) {
        const errStr = err instanceof Error ? err.message : 'Unknown error'
        recordTraceError({ feature: 'chat', userId, model: MODELS.sonnet, latencyMs: Date.now() - startMs, error: errStr })
        controller.enqueue(encoder.encode(streamErrorMessage(err, { feature: 'chat', userId })))
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
