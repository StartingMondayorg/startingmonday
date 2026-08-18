import { NextRequest } from 'next/server'
import { anthropic, MODELS } from '@/lib/ai/anthropic'
import { enforcePublicEndpointGuard } from '@/lib/public-endpoint-guard'

type ArchetypeKey =
  | 'cio'
  | 'cto'
  | 'ciso'
  | 'cdo'
  | 'chro'
  | 'cro'
  | 'coo'
  | 'cfo'
  | 'vp_it'
  | 'vp_engineering'
  | 'vp_sales'
  | 'vp_product'

const ARCHETYPES: Record<ArchetypeKey, { label: string; defaultRole: string; resume: string; linkedin: string }> = {
  cio: {
    label: 'CIO',
    defaultRole: 'Chief Information Officer',
    resume:
      'Bob Barker | Enterprise Technology Executive\n' +
      '20+ years leading enterprise IT strategy, cyber resilience, and modernization programs.\n' +
      'Built multi-year roadmaps that reduced operational spend by 18% while improving service reliability and audit posture.\n' +
      'Led global teams of 200+ across infrastructure, architecture, data, and security operations.\n' +
      'Owned $250M annual IT portfolio with board-level reporting on risk, resilience, and transformation KPIs.',
    linkedin:
      'Bob Barker is a technology executive focused on aligning IT investment to business outcomes. He leads at the intersection of operating discipline, modernization, and enterprise risk governance. Known for turning fragmented technology estates into reliable operating platforms with measurable financial impact.',
  },
  cto: {
    label: 'CTO',
    defaultRole: 'Chief Technology Officer',
    resume:
      'Bob Barker | Product and Platform Technology Leader\n' +
      'Scaled B2B SaaS architecture from single-region to multi-region global footprint with 99.95% uptime.\n' +
      'Cut release cycle time by 40% through platform engineering and CI/CD modernization.\n' +
      'Led 150+ engineering organization across platform, application, and reliability teams.\n' +
      'Partnered with product and revenue leaders to align roadmap sequencing with enterprise expansion goals.',
    linkedin:
      'Bob Barker is a CTO-level leader who connects platform choices to customer growth and product velocity. He specializes in modernizing engineering organizations and building resilient delivery systems that scale without losing quality.',
  },
  ciso: {
    label: 'CISO',
    defaultRole: 'Chief Information Security Officer',
    resume:
      'Bob Barker | Cybersecurity Executive\n' +
      'Built enterprise security program across identity, cloud posture, incident response, and third-party risk.\n' +
      'Reduced critical vulnerability exposure by 55% in 12 months while supporting cloud migration.\n' +
      'Led security and governance teams of 90+ with board-level risk communication.\n' +
      'Implemented measurable resilience metrics tied to regulatory and business continuity objectives.',
    linkedin:
      'Bob Barker is a CISO-level operator focused on enterprise resilience, practical risk reduction, and executive communication. He builds security programs that improve protection while enabling product and operating speed.',
  },
  cdo: {
    label: 'CDO',
    defaultRole: 'Chief Data Officer',
    resume:
      'Bob Barker | Data and Analytics Executive\n' +
      'Established enterprise data governance model and modern data platform supporting AI and analytics use cases.\n' +
      'Improved forecast accuracy by 22% and reduced reporting latency by 60%.\n' +
      'Led data engineering, governance, and analytics teams across 120+ personnel.\n' +
      'Aligned data strategy to revenue operations, customer retention, and executive planning cycles.',
    linkedin:
      'Bob Barker is a CDO-level leader who turns data strategy into operating outcomes. He is known for building governance and platform foundations that make analytics, AI, and decision quality materially better.',
  },
  chro: {
    label: 'CHRO',
    defaultRole: 'Chief Human Resources Officer',
    resume:
      'Bob Barker | People and Workforce Strategy Executive\n' +
      'Led enterprise workforce transformation supporting post-merger operating model changes.\n' +
      'Improved executive hiring cycle time by 30% and reduced regrettable attrition by 17%.\n' +
      'Built people analytics capability linking leadership bench strength to business outcomes.\n' +
      'Managed HR operating budget and board-level talent risk reporting.',
    linkedin:
      'Bob Barker is a CHRO-level executive focused on workforce strategy, executive talent systems, and operating alignment. He builds people functions that are measurable, strategic, and tightly linked to business priorities.',
  },
  cro: {
    label: 'CRO',
    defaultRole: 'Chief Revenue Officer',
    resume:
      'Bob Barker | Revenue Operations and Go-to-Market Executive\n' +
      'Scaled enterprise revenue organization through segmentation, sales process redesign, and pipeline governance.\n' +
      'Increased net revenue retention by 14 points and improved win-rate in strategic segments by 11 points.\n' +
      'Led global sales, revops, and customer success teams spanning 180+ people.\n' +
      'Built quarterly operating cadence linking forecast quality to hiring and investment decisions.',
    linkedin:
      'Bob Barker is a CRO-level leader who combines go-to-market rigor with operational discipline. He is known for improving forecast quality, pipeline health, and enterprise deal execution.',
  },
  coo: {
    label: 'COO',
    defaultRole: 'Chief Operating Officer',
    resume:
      'Bob Barker | Enterprise Operations Executive\n' +
      'Led enterprise operating model redesign across service delivery, systems, and governance layers.\n' +
      'Reduced cycle times by 28% and improved gross margin through process and platform standardization.\n' +
      'Managed cross-functional operations teams of 300+ with direct P&L accountability.\n' +
      'Implemented KPI architecture for weekly executive decision-making and escalation management.',
    linkedin:
      'Bob Barker is a COO-level operator focused on execution systems, cross-functional alignment, and measurable operating performance. He translates strategy into repeatable operational outcomes.',
  },
  cfo: {
    label: 'CFO',
    defaultRole: 'Chief Financial Officer',
    resume:
      'Bob Barker | Finance and Transformation Executive\n' +
      'Owned enterprise planning, FP&A, and capital allocation in high-growth and restructuring contexts.\n' +
      'Improved cash conversion and expense discipline while protecting strategic investment capacity.\n' +
      'Led finance teams of 100+ and built board-level scenario planning process.\n' +
      'Partnered with technology and operations leaders to tighten execution economics.',
    linkedin:
      'Bob Barker is a CFO-level leader who combines financial rigor with operational judgment. He is known for building planning systems that improve resilience, cash efficiency, and decision quality.',
  },
  vp_it: {
    label: 'VP IT',
    defaultRole: 'VP of IT',
    resume:
      'Bob Barker | VP, Information Technology\n' +
      'Led enterprise IT operations, architecture, and vendor strategy for multi-business organization.\n' +
      'Reduced incident volume by 35% and improved service-level performance across core systems.\n' +
      'Managed $90M annual IT budget and team of 140+ across infrastructure and applications.\n' +
      'Delivered modernization roadmap tied to operational reliability and business continuity.',
    linkedin:
      'Bob Barker is a VP IT leader focused on reliability, modernization, and operating discipline. He builds practical execution systems that improve business continuity while lowering complexity.',
  },
  vp_engineering: {
    label: 'VP Engineering',
    defaultRole: 'VP of Engineering',
    resume:
      'Bob Barker | VP Engineering\n' +
      'Scaled engineering organization from 60 to 180 with improved delivery predictability and quality metrics.\n' +
      'Implemented platform engineering standards that reduced release risk and accelerated cycle time.\n' +
      'Partnered with product on roadmap tradeoffs and staffing plans for strategic initiatives.\n' +
      'Led distributed engineering teams across backend, frontend, and reliability functions.',
    linkedin:
      'Bob Barker is a VP Engineering leader known for delivery rigor and platform modernization. He focuses teams on measurable outcomes, clear ownership, and sustainable execution velocity.',
  },
  vp_sales: {
    label: 'VP Sales',
    defaultRole: 'VP of Sales',
    resume:
      'Bob Barker | VP Sales\n' +
      'Led enterprise sales teams through segmentation redesign and multi-threaded account strategy.\n' +
      'Increased enterprise pipeline conversion and shortened sales cycles across strategic accounts.\n' +
      'Built forecasting cadence and coaching model improving execution consistency across regions.\n' +
      'Managed quota-carrying organization of 120+ and aligned with product and marketing leadership.',
    linkedin:
      'Bob Barker is a VP Sales operator focused on pipeline quality, forecast discipline, and enterprise account execution. He drives revenue outcomes through repeatable operating cadence and coaching.',
  },
  vp_product: {
    label: 'VP Product',
    defaultRole: 'VP of Product',
    resume:
      'Bob Barker | VP Product\n' +
      'Owned product strategy across enterprise platform and analytics portfolio.\n' +
      'Improved roadmap execution and reduced feature-to-adoption lag with tighter cross-functional planning.\n' +
      'Led product management organization of 70+ and partnered closely with engineering and go-to-market leaders.\n' +
      'Built operating model linking product bets to customer and financial outcomes.',
    linkedin:
      'Bob Barker is a VP Product leader who aligns product strategy to measurable business outcomes. He is known for clear prioritization, cross-functional alignment, and disciplined execution.',
  },
}

function fallbackTailoredBrief(company: string, role: string, archetypeLabel: string): string {
  return `## Candidate Snapshot
Bob Barker is a ${archetypeLabel} profile candidate with enterprise-scale leadership depth.

## Why This Fit Is Plausible at ${company}
- The role is likely evaluating operating discipline plus change leadership.
- This profile shows measurable transformation outcomes and executive-level communication.
- The candidate has experience leading cross-functional execution under financial and delivery constraints.

## Tailored Interview Brief for ${role}
- Open with a concise business-impact narrative, not a technical summary.
- Emphasize first-90-day execution priorities and governance approach.
- Address the top objection early: can this candidate drive change without creating delivery instability?

## Questions Likely Asked
- What would you prioritize in your first 90 days?
- How do you balance modernization and operational reliability?
- How do you align peers when priorities conflict?

## How Bob Barker Should Close
Close with confidence and clarity: restate the role mandate in business terms, align on next-step process, and leave one concrete operating statement that signals readiness to execute.`
}

export async function POST(request: NextRequest) {
  let company = ''
  let role = ''
  let archetype = 'cio'
  let resumeText = ''
  let linkedinSummary = ''

  try {
    const body = await request.json()
    company = typeof body.company === 'string' ? body.company.trim() : ''
    role = typeof body.role === 'string' ? body.role.trim() : ''
    archetype = typeof body.archetype === 'string' ? body.archetype.trim().toLowerCase() : 'cio'
    resumeText = typeof body.resumeText === 'string' ? body.resumeText.trim() : ''
    linkedinSummary = typeof body.linkedinSummary === 'string' ? body.linkedinSummary.trim() : ''
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  const blocked = await enforcePublicEndpointGuard({
    request,
    rateLimitKey: 'demo-brief-tailored',
    maxPerMinute: 20,
  })
  if (blocked) return blocked

  if (!company || !role) return new Response('company and role required', { status: 400 })
  if (company.length > 200 || role.length > 200) return new Response('Input too long', { status: 400 })

  const selected = ARCHETYPES[(archetype as ArchetypeKey)] ?? ARCHETYPES.cio
  const profileResume = resumeText || selected.resume
  const profileLinkedIn = linkedinSummary || selected.linkedin

  const prompt = `You are preparing an interview brief for a synthetic demo candidate named Bob Barker.

Candidate Archetype: ${selected.label}
Target Company: ${company}
Target Role: ${role}

Fake Resume:
${profileResume}

Fake LinkedIn Summary:
${profileLinkedIn}

Write a tailored interview brief with these exact sections:

## Candidate Snapshot
3-4 bullets on this candidate's strongest fit signals.

## Company Context to Acknowledge in the First 10 Minutes
4 bullets specific to likely business and operating pressures for ${company}.

## Tailored Interview Brief for ${role}
6 bullets: what Bob should emphasize and what he should avoid.

## Likely Questions and Strong Answer Frames
4 questions likely asked for this role at this company and 1-2 sentence answer frames for each.

## Opening Positioning Statement for Bob Barker
One concise paragraph Bob can say verbatim.

## Closing Move
2-3 sentences on how Bob should close and ask for next steps.

Rules:
- No em dashes.
- No motivational language.
- No filler.
- Keep every point specific to the supplied candidate profile, company, and role.`

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: MODELS.sonnet,
          max_tokens: 1600,
          messages: [{ role: 'user', content: prompt }],
        })
        stream.on('text', text => controller.enqueue(encoder.encode(text)))
        await stream.finalMessage()
        controller.close()
      } catch {
        controller.enqueue(encoder.encode(fallbackTailoredBrief(company, role, selected.label)))
        controller.close()
      }
    },
  })

  return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}

const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
