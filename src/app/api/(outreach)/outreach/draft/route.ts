import { type NextRequest, NextResponse } from 'next/server'
import { requireFeatureAccess } from '@/lib/require-feature-access'
import { OUTREACH_SYSTEM } from '@/lib/prompts'
import { anthropic, MODELS } from '@/lib/anthropic'
import { streamErrorMessage } from '@/lib/stream-error'
import { recordTraceError } from '@/lib/trace'
import { OutreachDraftBodySchema, firstZodError } from '@/lib/schemas'
import { appendWatermarkToStream } from '@/lib/watermark'
import { logEvent } from '@/lib/events'
import { captureServerEvent } from '@/lib/posthog-server'

const STYLE_INSTRUCTIONS: Record<string, string> = {
  concise: 'more concise: cut every unnecessary word, tighten each sentence, aim for half the length while keeping all the substance',
  warmer: 'warmer and more personable: add genuine human connection, make it feel like it comes from a real relationship',
  sharper: 'sharper and more direct: remove hedging language, be more confident and decisive in the ask',
  thoughtful: 'more thoughtful and considered: add more nuance and depth, show you have done your homework on this person',
}

const STYLE_GUIDELINES = `- Do not use em dashes anywhere in the message
- Do not use phrases like "I hope this finds you well", "I wanted to reach out", "touch base", or "circle back"
- Sound like a real human, not a template or AI
- No subject line needed, just the message body`

export async function POST(request: NextRequest) {
  const access = await requireFeatureAccess(request, 'outreach_draft')
  if (!access.ok) return access.response

  const { userId, supabase } = access

  let raw: unknown
  try { raw = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = OutreachDraftBodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 })
  }
  const { contactId, goal, additionalContext, currentDraft, refineStyle, refineInstruction } = parsed.data

  const [{ data: contact }, { data: profile }] = await Promise.all([
    supabase
      .from('contacts')
      .select('name, title, firm, channel, notes, companies(name)')
      .eq('id', contactId)
      .eq('user_id', userId)
      .single(),
    supabase
      .from('user_profiles')
      .select('full_name, positioning_summary, target_titles, target_sectors, beyond_resume')
      .eq('user_id', userId)
      .single(),
  ])

  if (!contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  }

  let prompt: string

  if (currentDraft && refineInstruction) {
    prompt = `Revise this outreach message based on these instructions: ${refineInstruction}

<draft>
${currentDraft}
</draft>

Apply the instructions exactly. Keep the same core goal unless the instruction changes it. Additional guidelines:
${STYLE_GUIDELINES}

Return only the revised message body, nothing else.`
  } else if (currentDraft && refineStyle && STYLE_INSTRUCTIONS[refineStyle]) {
    prompt = `Revise this outreach message to be ${STYLE_INSTRUCTIONS[refineStyle]}.

<draft>
${currentDraft}
</draft>

Keep the same core goal and content. Additional guidelines:
${STYLE_GUIDELINES}

Return only the revised message body, nothing else.`
  } else {
    if (!goal) {
      return NextResponse.json({ error: 'goal is required' }, { status: 400 })
    }

    const companyName = Array.isArray(contact.companies)
      ? (contact.companies[0] as { name: string } | undefined)?.name ?? null
      : (contact.companies as { name: string } | null)?.name ?? null

    const contactDesc = [
      `Name: ${contact.name}`,
      contact.title ? `Title: ${contact.title}` : null,
      contact.firm ? `Firm: ${contact.firm}` : companyName ? `Company: ${companyName}` : null,
      contact.channel ? `How we met: ${contact.channel}` : null,
      contact.notes ? `Notes: ${contact.notes}` : null,
    ].filter(Boolean).join('\n')

    const senderDesc = [
      profile?.full_name ? `Name: ${profile.full_name}` : null,
      profile?.positioning_summary ? `Background: ${profile.positioning_summary}` : null,
      profile?.target_titles ? `Target roles: ${profile.target_titles}` : null,
      profile?.target_sectors ? `Target sectors: ${profile.target_sectors}` : null,
      profile?.beyond_resume ? `Additional context: ${profile.beyond_resume}` : null,
    ].filter(Boolean).join('\n')

    prompt = `You are helping a senior executive draft a personalized outreach message.

SENDER:
${senderDesc || 'A senior executive in job search'}

RECIPIENT:
${contactDesc}

GOAL: ${goal}${additionalContext ? `\n\nADDITIONAL CONTEXT: ${additionalContext}` : ''}

Write a concise, warm, professional outreach message. Guidelines:
- 3-5 short paragraphs maximum
- Open with a specific, genuine reference to the person or how they met, not a generic opener
- State the ask clearly but without pressure
- End with a clear, low-friction call to action
${STYLE_GUIDELINES}`
  }

  const stream = await anthropic.messages.stream({
    model: MODELS.sonnet,
    max_tokens: 800,

    system: OUTREACH_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } catch (err) {
        recordTraceError({ feature: 'outreach_draft', userId, error: err instanceof Error ? err.message : String(err) })
        controller.enqueue(encoder.encode(streamErrorMessage(err, { feature: 'outreach_draft', userId })))
      } finally {
        controller.close()
      }
    },
  })

  const isRefinement = !!(parsed.data.currentDraft && (parsed.data.refineStyle || parsed.data.refineInstruction))
  logEvent(userId, 'outreach_draft_generated', { contact_id: contactId, is_refinement: isRefinement }).catch(() => {})
  captureServerEvent(userId, 'outreach_draft_generated', { contact_id: contactId, is_refinement: isRefinement })

  return new NextResponse(appendWatermarkToStream(readable, userId), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
