import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'
import { anthropic, MODELS } from '@/lib/anthropic'
import { streamErrorMessage } from '@/lib/stream-error'
import { recordTraceError } from '@/lib/trace'
import { fetchProspectNews } from '@/lib/prospect-news'

const TYPE_CONTEXT: Record<string, string> = {
  outplacement: `The prospect is an executive outplacement firm. Their business is helping organizations transition senior leaders out gracefully -- career coaching, positioning, networking, and job search support for executives at VP level and above. They sell to HR departments and CEOs, and they resell or white-label tools to put in the hands of their executive clients.

The competitive context they live in: BPI, LHH, RiseSmart, Challenger Gray & Christmas -- all firms built for mid-level transitions that have been pushed upmarket. Their executive clients know the difference between a tool designed for them and one that was adapted. The executives they serve are running searches worth $400K-$1M in total compensation. Embarrassing tools cost the outplacement firm the relationship.

What Starting Monday offers them:
- A platform their executive clients will actually use, because it reads the executive's profile and speaks specifically to their search -- not a generic job search tool
- Daily briefings that keep the search moving without requiring a coach to drive every action
- Interview prep briefs built around the specific company, the specific role, the specific interviewer -- not generic frameworks
- Outreach drafted in the executive's voice, not templates
- Pricing: $30-50/seat/month, or flat per-cohort licensing. Volume discounts available. White-label option.

The core tension they feel: they want to deliver better outcomes for senior executives but their current tools were not built for this level. Starting Monday was.`,

  mba_program: `The prospect is an MBA program or executive education career center. They serve alumni and current students who are senior executives -- VPs, SVPs, and C-suite -- in active or passive job search. The career center's credibility with alumni depends on being genuinely useful at the career inflection points that matter most.

The problem they cannot solve with current tools: the VP+ search takes 9-18 months. MBA career centers see alumni at graduation and occasionally at reunion. During the actual search, alumni are managing their own pipelines, writing their own outreach, and walking into interviews with the same prep as everyone else. The career center has no visibility and no touchpoint.

What Starting Monday offers them:
- A platform alumni will use, because it reads their profile and delivers specific intelligence on their target companies -- not another job board or ATS
- An institutional license model ($8,000-$25,000/year) that gives all alumni access without per-seat management overhead
- A branded alumni career resource the school controls and can point to -- not a third-party consumer app
- A reporting dashboard showing aggregate engagement, so the career center knows the tool is being used, without compromising alumni privacy
- Implementation is minimal: alumni receive a login link and are set up in under 10 minutes

The core tension they feel: alumni engagement at the senior level is low because the tools are not peer-level. Starting Monday changes what the career center can offer.`,

  vc_pe: `The prospect is a venture capital or private equity fund. They regularly manage executive transitions -- departing founders, replaced CEOs, functional leaders exiting after a restructuring. These transitions are sensitive. How the fund handles them affects its reputation with executives across the portfolio and the market.

The stakes: a portfolio executive who transitions well and lands in a strong next role remembers who invested in their next chapter. One who struggles during the search -- six months with no momentum, interviews without preparation, outreach that goes nowhere -- remembers that too. The fund's ability to attract strong operators depends partly on this reputation.

What Starting Monday offers them:
- A concrete, valuable separation benefit: "We're giving you 12 months of Starting Monday" signals real investment in the executive's next chapter, not a handshake and a LinkedIn recommendation
- Confidential by design -- no social features, no public profile, no peer comparison, no data shared with the fund
- The executive gets daily briefings on their target companies, AI-generated interview prep tailored to the specific company and role, and outreach drafted in their own voice using the network they built at the portfolio company
- Pricing: $1,500-2,500/year per executive. For 10 transitions annually, that is a rounding error on a typical severance package and dramatically outperforms the cost of a strained relationship
- Complements executive coaches rather than replacing them -- the systematic parts of the search are handled, the coach focuses on the relationship work

The core tension they feel: they want to handle transitions professionally but their current options are generic career tools or expensive human coaches. Starting Monday fills the gap.`,

  other: `Starting Monday is an AI platform built specifically for VP and C-suite executives in active job search. It is not a job board. It is not a resume builder. It runs the executive's search: tracking target companies and surfacing signals when timing shifts, preparing them for interviews with company-specific briefs that go beyond press releases, drafting outreach in their voice using their actual network, and keeping actions moving with a daily briefing. Every interaction is built on the executive's profile -- not generic prompts or templates. Pricing is $49-129/month direct, or $30-50/seat/month for institutional licenses with volume discounts and white-label options available.`,
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const staff = await getStaffMember(user.email ?? '')
    if (!staff) return new Response('Forbidden', { status: 403 })

    let body: {
      prospectName: string
      prospectType: string
      estimatedSeats?: number | null
      estimatedArr?: number | null
      notes?: string | null
      contactName?: string | null
      contactTitle?: string | null
      additionalContext?: string
    }
    try { body = await request.json() } catch {
      return new Response('Invalid JSON', { status: 400 })
    }

    const { prospectName, prospectType, estimatedSeats, estimatedArr, notes, contactName, contactTitle, additionalContext } = body

    const typeContext = TYPE_CONTEXT[prospectType] ?? TYPE_CONTEXT.other

    const newsItems = await fetchProspectNews(prospectName, prospectType)
    const recentSignals = newsItems.length > 0
      ? newsItems.map(n => `- ${n.title}${n.pubDate ? ` (${n.pubDate.slice(0, 10)})` : ''}${n.description ? ': ' + n.description.replace(/<[^>]+>/g, '').slice(0, 150) : ''}`).join('\n')
      : ''

    const prompt = `You are writing a leave-behind document for a B2B sales meeting. This document will sit on the desk of a decision-maker after Richard Rothschild leaves the room. It should read like material from a top-tier advisory firm: precise, confident, and specific to this organization. Not a pitch deck. Not a startup brochure.

PROSPECT
Name: ${prospectName}
Type: ${prospectType.replace(/_/g, ' ')}${estimatedSeats ? `\nEstimated users: ${estimatedSeats}` : ''}${estimatedArr ? `\nEstimated annual value: $${estimatedArr.toLocaleString()}` : ''}${contactName ? `\nKey contact: ${contactName}${contactTitle ? `, ${contactTitle}` : ''}` : ''}${notes ? `\nContext: ${notes}` : ''}${additionalContext ? `\nAdditional context: ${additionalContext}` : ''}

PROSPECT CONTEXT
${typeContext}
${recentSignals ? `\nRECENT SIGNALS (from public news, last 90 days)\nUse one or two of these where they genuinely strengthen the argument -- to show you understand their current situation. Do not force them in. Do not invent details beyond what is stated. Do not cite article titles or URLs.\n${recentSignals}` : ''}
THE PRODUCT
Starting Monday is an AI platform built specifically for VP and C-suite executives in active job search. It reads the executive's actual profile before every interaction -- their background, their targets, their voice -- and uses that to run the search with them. Core capabilities: a daily briefing on target companies surfacing signals that indicate timing shifts; interview prep briefs built around the specific company, the specific role, and what the interviewer is actually evaluating; outreach drafting in the executive's voice, not templates; and pipeline tracking that keeps actions moving. It is not a job board. It is not a generic AI chatbot. It is the first platform purpose-built for VP+ search.

THE TASK
Write a leave-behind document (750-950 words) for ${prospectName}.

STRUCTURE AND INTENT
Each section has a specific job to do. Write to that job, not to a template.

1. Headline (one sentence). This is a thesis, not a tagline. It should name what Starting Monday specifically does for this type of organization -- and it should be specific enough that someone from a different industry would know it wasn't written for them. Do not use the words "platform", "solution", "tool", "AI-powered", or "transform".

2. Opening paragraph (no header). Two to three sentences. Name the gap that exists right now -- the moment where their executives are on their own, without the right support, and what happens as a result. Make the reader feel seen. Do not introduce Starting Monday yet.

3. What Starting Monday provides (header should be specific to their use case, not generic). Four to five capabilities. Each is one precise sentence. Lead with the outcome the executive experiences, then what produces it. No feature names. No bullet padding. No parallel structure for its own sake.

4. What the engagement looks like (header: "Working with Starting Monday"). Pricing model specific to their type, implementation lift, what they do not have to manage. Be concrete. Use the numbers from the prospect context. If estimated seats or ARR are provided, reference them.

5. Why this, why now (header should be forward-looking and specific). One paragraph. Name what is changing in their market or their clients' expectations that makes this the right moment. Not urgency tactics. A genuine observation about timing.

6. Next step. One or two sentences. Specific. Richard's full name and email: richard@startingmonday.app.

VOICE AND STANDARDS
This document represents Starting Monday as a company that knows exactly what it is doing. The writing should reflect that.

Write in short, declarative sentences. Use active voice throughout. Every sentence must earn its place -- if it could be cut without losing meaning, cut it.

Do not use: transform, leverage, robust, seamlessly, innovative, cutting-edge, game-changing, world-class, next-level, comprehensive, empower, unlock, journey, ecosystem, holistic, best-in-class, or any variant of "the reality is."

Do not open a paragraph with "At [Company Name]" or "For [Company Name]." Do not use throat-clearing phrases like "The fact is," "It is worth noting," or "Ultimately."

Headers should be substantive statements, not category labels. "The Problem" is a category label. "When the Search Runs Without Support, the Search Runs Slowly" is a statement. Write headers at that level of specificity.

The document should be indistinguishable from something a McKinsey partner would hand to a client. Specific. Peer-level. No startup enthusiasm.

FORMAT RULES -- follow exactly:
- Plain text only. No markdown. No # signs. No ** asterisks. No bullet dashes. No horizontal rules.
- Section headers: write them as a short ALL-CAPS label on its own line, followed by a blank line. Example: "WHEN THE SEARCH LOSES MOMENTUM"
- Capability list: write each item as a short bold-free paragraph starting on a new line with a number and period (1. 2. 3.). No dashes. No asterisks.
- Do not use em dashes anywhere. Use a comma, a period, or rewrite the sentence. This is a hard rule.
- Do not use parentheses for asides. Rewrite as a sentence.
- Blank line between every paragraph and every section.`

    const stream = await anthropic.messages.stream({
      model: MODELS.sonnet,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text.replace(/\\u2014/g, ',').replace(/#+\s?/g, '').replace(/\*\*/g, '')
              controller.enqueue(encoder.encode(text))
            }
          }
        } catch (err) {
          console.error('[admin.b2b-material] stream failed', err)
          recordTraceError({ feature: 'b2b_material', userId: user.id, error: err instanceof Error ? err.message : String(err) })
          controller.enqueue(encoder.encode(streamErrorMessage(err, { feature: 'b2b_material', userId: user.id })))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (error) {
    console.error('[admin.b2b-material] request failed', error)
    return new Response('Internal server error', { status: 500 })
  }
}
