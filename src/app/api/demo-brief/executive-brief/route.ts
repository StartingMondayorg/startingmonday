import { NextRequest, NextResponse } from 'next/server'
import { anthropic, MODELS } from '@/lib/ai/anthropic'
import { PREP_SYSTEM } from '@/lib/ai/prompts'
import { enforcePublicEndpointGuard } from '@/lib/public-endpoint-guard'

// Fictional demo candidate: senior enterprise IT leader, VP-level, targeting CIO/VP of IT.
// Designed to show the full brief depth to Mark Horstman without exposing any real user data.
const DEMO_CANDIDATE = `\
Name: Michael Torres
Current/recent title: VP, IT Transformation
Current/recent company: Humana
Candidate level: VP / SVP (targeting VP, SVP, or EVP; may be stepping to C-suite)
Role type: CIO (Chief Information Officer).

FRAMING: Business-technology integration, enterprise risk governance, board reporting line, \
vendor portfolio rationalization, and transformation mandate. This is a business-leadership \
role with technology accountability, not a technical architecture role. Every section must \
reflect that the CIO owns the relationship between technology investment and business outcome.

Target roles: VP of IT, SVP IT, Chief Information Officer
Target sectors: Technology, Financial Services, Healthcare

Positioning: Enterprise IT leader who inherits fragmented, acquisition-heavy technology \
environments and builds coherent architecture, vendor discipline, and team capability. \
Consistent track record of operating at the intersection of IT governance and business outcome. \
Known for translating technology programs into CFO-legible business cases.

Career history (confirmed by the executive - treat as authoritative):

Humana | VP, IT Transformation | 2020 to present
  Consolidated 14 acquired technology platforms into a unified data architecture, reducing \
infrastructure spend by $47M annually. Built and led a 340-person IT organization through \
a $1.2B digital transformation initiative spanning EHR modernization, cloud migration, and \
vendor contract rationalization. Reported to the CIO; accountable for a $380M annual IT budget.

PricewaterhouseCoopers | Principal, Technology Strategy | 2016 to 2020
  Led enterprise architecture and IT strategy engagements for 12 Fortune 500 clients. \
Specialized in post-merger integration and cloud migration programs ranging from $80M to \
$400M in scope. Clients included three healthcare payers and two financial services firms \
navigating major acquisitions.

Cigna | Director, Enterprise Architecture | 2012 to 2016
  Designed the reference architecture for Cigna's integration of the HealthSpring acquisition \
($3.8B deal). Reduced duplicate application systems from 47 to 19 in 18 months. Led \
a 60-person architecture team; accountable for the enterprise integration roadmap through \
close and stabilization.

Deloitte | Senior Manager, Technology Consulting | 2008 to 2012
  Led IT due diligence on 22 private equity transactions. Developed post-close technology \
roadmaps for portfolio companies across healthcare, insurance, and financial services.`

const DEMO_COMPANY = `\
Name: Salesforce
Sector: Enterprise Technology / SaaS
Company size: Enterprise (2,000+ employees)
Pipeline stage: researching

Intel and notes: Salesforce is under sustained pressure from activist investors, including \
Elliott Management, which took a large stake in 2023 and pushed hard for margin expansion \
and operational discipline. The company responded by cutting roughly 10% of its workforce \
and committing to a 25%+ non-GAAP operating margin target. Marc Benioff has returned as \
sole CEO. Every internal function, including IT, is expected to justify spend with precision. \
The Slack acquisition ($27.7B) has not delivered the enterprise collaboration lift that was \
projected; internal IT owns Slack as the enterprise collaboration backbone and its adoption \
gap inside Salesforce is a credibility problem for the platform strategy. Salesforce has \
also acquired MuleSoft ($6.5B), Tableau ($15.7B), and Mulesoft, creating a complex \
heterogeneous internal application estate. The VP of IT role exists in a company that sells \
CRM and enterprise software to IT leaders, meaning the internal IT function is both a cost \
center and a proof point for the company's own product narrative. Agentforce (AI agent \
platform) is the current strategic bet; the CIO function will be expected to be an early \
adopter and internal reference customer.`

const PROMPT = `Prepare an elite pre-interview brief for the following situation. \
This is the level of preparation a top executive coach produces: specific, direct, and \
grounded in the actual data below.

CANDIDATE
${DEMO_CANDIDATE}

COMPANY
${DEMO_COMPANY}

JOB SCAN DATA
No career page scan on file. CIO and VP of IT searches frequently run through retained search \
and rarely appear on public career pages. Use company notes and sector context to infer the \
transformation mandate.

KNOWN CONTACTS
No contacts on file.

---

Write the brief with these exact sections, using ## for each header:

## Bottom Line
Three sentences only. No preamble, no company context, no hedging. The first states the \
candidate's single decisive advantage for this role: what specifically makes them the hire \
over everyone else being considered. The second names the most dangerous objection they will \
face: the one that, if not addressed, loses them the offer. The third states the single \
thing they must do or say in this conversation to close it. If they read nothing else, \
these three sentences are everything they need to walk in. Commit fully.

## The Situation
What is actually driving this hire? What problem does this organization need solved, and \
why now? Infer from the sector, pipeline stage, notes, and scan data. Be direct. This sets \
the frame for everything else.

## Win Thesis
One paragraph. Written as a conviction, not a summary. Not why the candidate is qualified, \
but why they win this specific role over everyone else being considered. What is the decisive \
advantage. Make the candidate feel it.

## The Narrative
How to tell their story for THIS room. Which chapters of their background to lead with, \
which to compress, which to leave out entirely. Close with one specific through-line sentence \
they can use as their opening positioning statement, ready to say verbatim.

## Anticipated Pushback
The 3-4 most likely objections or challenges this candidate will face. Order by lethality: \
the objection most likely to kill the candidacy goes first. For each, state the objection \
directly and give the exact counter. Format each as:
**They push:** [the objection]
**You say:** [specific counter, not defensive, not vague]

## Likely Questions
The 4-5 questions this interviewer will almost certainly ask, derived from the intersection \
of this specific role, this company's situation, and this candidate's background. Not generic \
behavioral questions: questions that arise because of who this person is and what this company \
needs right now. For each:
**They ask:** [the question, phrased as they would actually say it]
**What they're probing:** [what is actually being tested underneath the question, one sentence]
**Strong answer frame:** [how to approach it: what to lead with, what to include, what to \
avoid, 2-3 sentences. The structure of a strong answer, not the answer itself]

## Talking Points
5 specific, story-anchored points to make in the interview. Order by impact: the strongest, \
most differentiating point goes first. Each must connect an element of the candidate's actual \
background to this company's specific situation. Not generic strengths. Points that land in \
this room. Format:
**[Point title]** [2-3 sentences: what to say and exactly why it resonates here]

## Questions to Ask
5 questions that signal the candidate is a strategic peer, not an applicant. Lead with the \
single question most likely to distinguish this candidate from everyone else in the room. \
Each should demonstrate a specific kind of executive intelligence. After each question, one \
sentence on what it signals to the interviewers.

## First 90 Days Signal
2-3 specific observations or priorities to surface naturally in conversation, not as a \
formal plan, but as proof the candidate has already started thinking like an insider. Phrase \
each as something they would actually say in the room, then note why it lands.

## What to Leave Out
3-4 explicit topics, framings, or stories to avoid in this specific conversation, and why \
each would hurt them here. Be direct.

## How to Close
What to do and say in the final 3-5 minutes of this specific conversation. Three elements, \
each ready to use verbatim or near-verbatim:

**Express interest:** One or two sentences that state genuine interest in this role without \
hedging or desperation. Calibrate to VP-level closing with a senior interviewer.

**Ask about process:** One sentence that asks about next steps as a peer, not an applicant. \
No anxiety. Phrase it as someone who assumes they are a serious candidate.

**Final impression:** The one thought to leave them with in the last 30 seconds. What to say, \
reference, or do so they are still thinking about this candidate after the call ends.

## Reading the Room
How to interpret the signals at the end of this specific conversation. Cover the 3-4 most \
likely signal patterns given this company, this role, and this candidate's situation. For each:
**Signal:** [what they observe: specific language, behavior, or energy shift]
**What it means:** [the real interpretation, one sentence, no hedging]
**Your move:** [what to do within the next 24 hours in response]

Include at least one strong positive signal and one soft negative signal. Be specific to \
Salesforce's culture and this seniority level.

Tone: direct, senior-to-senior. Short paragraphs. No em dashes. No hedging. No motivational \
language.`

const FALLBACK_MANAGER_TOOLS_BRIEF = `## Bottom Line
Your decisive advantage is your track record integrating acquisition-heavy enterprise environments while improving operating discipline. The biggest risk is being seen as transformation-only without enough day-one operating cadence for Salesforce's current margin and execution pressure. In this conversation, win by showing exactly how you sequence governance, platform priorities, and measurable outcomes in the first 90 days.

## The Situation
Salesforce is balancing growth expectations, margin pressure, and platform credibility at the same time. Internal IT is not just an internal function, it is a proof point for enterprise customers evaluating Salesforce's own platform claims. The VP-level CIO path is about execution clarity under financial scrutiny.

## Win Thesis
You win this role by being the candidate who can modernize an enterprise stack without losing operating control. Your record in integration-heavy environments, budget ownership, and cross-functional governance maps directly to Salesforce's need for disciplined execution now.

## The Narrative
Lead with business outcomes delivered through IT governance, then show one example of reducing complexity while accelerating delivery. Keep deep technical detail secondary to business impact language. Through-line: I build enterprise technology operating systems that improve speed, control, and measurable business results.

## Anticipated Pushback
**They push:** You are transformation-heavy, but this role needs immediate operating execution.
**You say:** My model starts with operating cadence in week one, then sequences transformation against measurable business outcomes.

**They push:** How do you avoid disruption in a complex environment?
**You say:** I stabilize decision rights and delivery governance first, then phase modernization to protect continuity.

## Likely Questions
**They ask:** What are your first 90 days here?
**What they're probing:** Whether you can establish control and momentum quickly.
**Strong answer frame:** Start with assessment of operating risk, define top priorities with business leaders, then commit to near-term wins and explicit metrics.

**They ask:** How do you connect IT investment to enterprise outcomes?
**What they're probing:** Executive judgment and financial discipline.
**Strong answer frame:** Tie platform choices to revenue, margin, and risk outcomes, and show how governance prevents drift.

## Talking Points
**Enterprise integration discipline** You have repeatedly reduced complexity after acquisitions while maintaining delivery continuity.

**CFO-legible operating model** You frame IT tradeoffs in financial and business terms senior stakeholders can act on.

**Execution under pressure** You build governance that improves speed and quality without creating process drag.

## Questions to Ask
How is internal IT currently expected to demonstrate platform credibility for enterprise customers?
What execution risks worry leadership most in the next two quarters?
Where do operating decisions stall today between IT, finance, and product?

## First 90 Days Signal
I would align on three measurable outcomes, one governance reset, and one platform decision that proves execution speed without sacrificing control.

## What to Leave Out
Avoid broad transformation language without execution sequence. Avoid architecture deep dives that are disconnected from business outcomes. Avoid talking about change velocity without governance safeguards.

## How to Close
Express interest by stating clear alignment with Salesforce's execution mandate. Ask about process with confidence and peer-level tone. Leave them with a crisp operating statement: I improve enterprise technology outcomes by making execution disciplined, measurable, and repeatable.

## Reading the Room
If they ask follow-up questions about first-90-day sequencing, that is a strong signal they are modeling you in-role. If they stay generic and avoid operating specifics, interest is likely softer. Your move in 24 hours is a concise follow-up note restating your top 90-day priorities and the outcomes they enable.`

export async function POST(request: NextRequest) {
  if (request.nextUrl.searchParams.get('monitor') === '1') {
    return NextResponse.json({ ok: true, mode: 'monitor' }, { status: 202 })
  }

  const blocked = await enforcePublicEndpointGuard({
    request,
    rateLimitKey: 'demo-brief-executive-brief',
    maxPerMinute: 20,
  })
  if (blocked) return blocked

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: MODELS.sonnet,
          max_tokens: 4000,
          system: PREP_SYSTEM,
          messages: [{ role: 'user', content: PROMPT }],
        })
        stream.on('text', text => controller.enqueue(encoder.encode(text)))
        await stream.finalMessage()
        controller.close()
      } catch (err) {
        controller.enqueue(encoder.encode(FALLBACK_MANAGER_TOOLS_BRIEF))
        controller.close()
      }
    },
  })

  return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
