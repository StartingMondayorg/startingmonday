import { NextRequest } from 'next/server'
import { anthropic, MODELS } from '@/lib/ai/anthropic'
import { enforcePublicEndpointGuard } from '@/lib/public-endpoint-guard'

const SYSTEM =
  'You are a senior executive coach preparing a candidate for a high-stakes interview. ' +
  'Rules: Be specific. Name real business conditions, strategic pressures, and known challenges for this specific company. ' +
  'No generic advice. Every sentence must be specific to this company and this role. ' +
  'No filler. No em dashes. No motivational language. This is coaching, not cheerleading.'

function fallbackBrief(company: string, role: string): string {
  return `## What ${company} Is Navigating Right Now
- Leadership teams are under pressure to prove ROI on every transformation dollar.
- Hiring decisions for ${role} now emphasize execution speed and operating discipline.
- Decision makers are looking for candidates who can align technology choices with measurable business outcomes.
- Interviewers will test whether you can lead cross-functional change without creating execution drag.

## What They Need in a ${role}
- Build trust quickly with a practical 90-day operating plan tied to business priorities.
- Establish governance that improves delivery quality while reducing decision friction.
- Translate platform, security, and modernization work into CFO-legible business impact.
- Drive alignment across product, finance, and operations on sequencing and tradeoffs.

## How to Open the First Conversation
Lead with how you diagnose current-state execution risk, then show how you prioritize a focused first-90-day plan. Keep the frame on outcomes, not architecture detail. Signal that your operating model improves decision quality while preserving momentum.

## Five Questions to Prepare For
- What would you do in your first 90 days? Anchor on assessment, prioritization, and measurable wins.
- How do you balance modernization and cost discipline? Show your tradeoff framework and sequencing logic.
- How do you lead through resistance from peers? Use one concise example with stakeholder alignment.
- How do you measure success for this role? Define business and delivery metrics together.
- Why this role and why now? Tie your background directly to this company's current mandate.`
}

export async function POST(request: NextRequest) {
  let company: string, role: string
  try {
    const body = await request.json()
    company = typeof body.company === 'string' ? body.company.trim() : ''
    role    = typeof body.role    === 'string' ? body.role.trim()    : ''
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  const blocked = await enforcePublicEndpointGuard({
    request,
    rateLimitKey: 'demo-brief',
    maxPerMinute: 20,
  })
  if (blocked) return blocked

  if (!company || !role) return new Response('company and role required', { status: 400 })
  if (company.length > 200 || role.length > 200) return new Response('Input too long', { status: 400 })

  const prompt = `Generate a prep brief for a candidate interviewing for ${role} at ${company}.

## What ${company} Is Navigating Right Now
4-5 bullet points. The specific business conditions, strategic priorities, and known challenges this company faces right now. Name their competitive dynamics, recent leadership transitions, strategic shifts, or market pressures. Be specific to this company's actual situation, not generic industry trends.

## What They Need in a ${role}
4-5 bullet points. Given the company's specific situation, the capabilities and experience that will matter most for this role. What problems this person will be asked to solve in the first 12 months. What will make them succeed or fail at this specific company.

## How to Open the First Conversation
3-4 sentences. The specific frame to use in the first 10 minutes. Not a generic opening. A narrative that connects a senior leader's background to this company's actual situation. Reference something real and specific about the company.

## Five Questions to Prepare For
Five questions this company is likely to ask a ${role} candidate. For each, one sentence of coaching on how to answer it. Make the questions specific to this company's situation.

Use ## for section headers. Use - for bullets. No em dashes. Write at senior executive level. Be direct.`

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: MODELS.sonnet,
          max_tokens: 1400,
          system: SYSTEM,
          messages: [{ role: 'user', content: prompt }],
        })
        stream.on('text', text => controller.enqueue(encoder.encode(text)))
        await stream.finalMessage()
        controller.close()
      } catch (err) {
        const fallback = fallbackBrief(company, role)
        controller.enqueue(encoder.encode(fallback))
        controller.close()
      }
    },
  })

  return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
