# Starting Monday — Persona Pushback and Friction Analysis

**Date:** May 2026  
**Purpose:** Honest assessment of the objections, friction points, and failure modes for each persona. Use this to prioritize product, messaging, and onboarding improvements.

---

## How to Read This Document

Each persona section covers five dimensions:

1. **Search dynamic** — How this persona actually conducts a search and what drives outcomes
2. **Pre-trial pushback** — Objections that prevent them from signing up at all
3. **In-product friction** — Points where they get stuck, lose confidence, or disengage after signing up
4. **Critical failure mode** — The single thing most likely to lose them permanently
5. **Win condition** — What converts them to a paying, retained customer

---

## Universal Pushback (Applies to All Personas)

These objections exist before any persona-specific concern surfaces.

**"I already have a network."**
Every senior executive believes their relationships are their primary search asset — and they are right. The product does not replace the network. The positioning must be explicit: Starting Monday manages the operational infrastructure of the search so the network work gets done better, not instead.

**"I'm not actively searching."**
Most of the target audience is employed. They do not self-identify as "in search." They are "exploring," "open to the right opportunity," or "not actively looking but would consider something compelling." Any language that implies they are in active search creates identity discomfort. The product must welcome passive positioning as a first-class use case.

**"My search firm handles this."**
Senior executives with existing search firm relationships believe those relationships cover their needs. What they do not see: search firms work for the hiring company, not for them. The executive has no visibility into what the firm is doing, where they stand in the process, or what other firms know about them. Starting Monday fills that visibility gap — but the positioning must not be adversarial to search firms, which the executive values.

**"Will this get out?"**
The confidentiality concern is deeper than the trust statement on the landing page addresses. It is not just "will you share my data." It is: "Does this create a digital record of my search that could surface somewhere?" The executive is worried about a breach, a subpoena, an acquisition, a LinkedIn data leak, anything. Addressing this requires more than a policy — it requires architectural clarity about what is stored and who can access it.

**"This looks like it was built for someone more junior."**
First impression matters enormously with this audience. A UI that feels like a junior job-seeker tool — any trace of resume templates, job application tracking, "follow-up in X days" nagging language — triggers immediate dismissal. The product must feel like infrastructure for a senior operator, not a tool for managing applications.

**"The OAuth screen showed a Supabase URL."**
Already surfaced in beta. For a security-conscious audience that scrutinizes authentication flows professionally, a random supabase.co subdomain looks like a phishing attempt. This is a resolved item (auth.startingmonday.app via custom domain) but it will recur in the minds of anyone who saw it before the fix. The resolution belongs in the product narrative: "We use enterprise-grade authentication infrastructure."

---

## CIO — Chief Information Officer

### Search Dynamic
CIO searches are largely invisible until they are not. Most mandates are created before a role is posted — a board decides the current CIO is not the right fit for the next phase, a PE sponsor decides to upgrade the function, a CEO loses confidence and starts a quiet search. The executive learns about the role through a search firm partner who calls them, a peer referral, or a board member they know. The CIO who is waiting for a job posting has already lost.

The search timeline is 9-18 months from first signal to offer. It requires sustained relationship maintenance with 5-8 search firm partners and 20-30 active company targets simultaneously. This is genuinely difficult to manage without infrastructure.

### Pre-Trial Pushback

**"I've been doing this for 20 years. I know how to prepare for an interview."**
Experience breeds overconfidence in preparation. A CIO who has run multiple searches believes their pattern recognition is sufficient. What they underestimate: the interrogation has become more rigorous (board presentations, PE due diligence, AI-era transformation questions) and the preparation bar has risen. The positioning must make the expert feel that Starting Monday does not teach them how to search — it handles the operational load so they can focus on the relationships.

**"I don't want to be tracked."**
Some CIOs, particularly those at public companies or in regulated industries, have genuine concern about creating digital records of their search. They are right to be cautious. This goes beyond confidentiality messaging — it requires the ability to explain exactly what data is stored, in what form, and what the deletion process is.

**"I tried to use it and the AI got my career history wrong."**
This is a live beta issue. LinkedIn data import at senior levels is imprecise — acquisitions create ambiguous company entries, title inflation across eras means old Director roles read as equivalent to current C-suite roles, and the AI makes inferences that contradict lived experience. A CIO who sees their career summarized incorrectly loses trust in everything the platform produces.

**"My assistant handles this."**
Some CIOs delegate calendar, research, and logistics to an EA. The product assumes solo use. There is no delegation model, no role-based access, no "forward this brief to my assistant" workflow. This is not a blocker for most, but it is a friction point for the most senior segment.

### In-Product Friction

**Career history import quality**
The LinkedIn import must be accurate to build trust. For CIOs with acquisitions in their history (Glu being acquired by EA, for example), the import conflates entities, misattributes roles, and can produce a career summary that contradicts what the CIO knows to be true. The first generation of any AI output using flawed input will be wrong. Wrong output in the first session = permanent loss of trust.

**"There is no job posting" when there clearly is one**
The platform says it found no posting even when the executive provided a company careers link. The scanner runs on a schedule and the timing disconnect is not communicated. The executive assumes the product is broken, not that the crawl has not run yet. This must be resolved — either by instant processing of a provided URL (now partially addressed with the posting URL input) or by explicit communication: "Your scan runs tonight. Check back at 6am."

**Scan returns "no matching roles" at companies where the executive knows a role exists**
The scan logic may miss roles that are titled differently ("VP IT" instead of "CIO"), posted on a subsidiary career page, or listed through a search firm rather than on the corporate site. The executive knows the role exists. The platform says it does not. This destroys confidence in the intelligence function.

**The prep brief surfaces factual errors**
Even with correct career input, the AI infers things that are wrong — wrong outcomes attributed to wrong roles, wrong company details, wrong industry assumptions. A factual error in the Win Thesis or Anticipated Pushback section is worse than a generic brief. A generic brief is useless. An inaccurate brief is actively harmful if the executive uses it.

**"The Situation section said there is no job posting"**
Addressed above — but the language "there is no job posting" is also wrong in tone. The correct framing: "No public posting found — this role may be unlisted or filled through search. Here is what we know about the likely mandate based on org signals." That is informative. "There is no job posting" is a dead end.

**What to Leave Out section was cut off**
Fixed (token limit raised to 8000). But the damage to trust from a truncated section in beta is real. Executives who saw this are carrying a "the product is half-baked" impression.

### Critical Failure Mode
The AI produces a prep brief with a factual error about the executive's own career — wrong title, wrong company attribution, wrong outcome. The executive uses it in preparation and either notices before the interview (loses confidence in the product) or — far worse — uses the wrong framing in the interview itself. One bad experience of this type gets shared with peers. This audience has tight networks.

### Win Condition
The brief is so specific, so accurate, and so clearly better than anything they could produce in 45 minutes of their own research that they immediately forward it to a trusted colleague and say "you have to see this." The Win Thesis names the precise reason they win this specific role. The Anticipated Pushback predicts the exact objection they were already worried about. The Questions to Ask make them feel like a peer, not an applicant. That experience — at minimum once in the first session — converts a skeptic.

---

## CTO — Chief Technology Officer

### Search Dynamic
CTO searches bifurcate sharply between startup and enterprise. A startup CTO (Series B, $50M ARR) is usually recruited by board members and investors, not search firms. An enterprise CTO ($500M+ revenue company) goes through a process closer to a CIO search. The product implicitly assumes enterprise CTO context. Startup CTOs will find the company intelligence and pipeline tracking valuable but the interview prep framing wrong.

### Pre-Trial Pushback

**"This is just Claude with a wrapper."**
CTOs are the most technically sophisticated persona on the platform. They will evaluate the product as engineers. A CTO who concludes that Starting Monday is a thin UI over the Anthropic API without structural intelligence or real data — a conclusion they can reach in 20 minutes — will dismiss it publicly and loudly. The differentiation must be architecturally legible: the value is the context assembly (career profile + company data + scan results + signals + contacts), not the model.

**"The AI will hallucinate things about my company targets."**
CTOs understand model limitations better than any other persona. They know that Claude does not have real-time company intelligence. They know that the model will confidently state things that are wrong. Their skepticism about AI output quality is calibrated and correct. The product must be explicit about what is and is not AI-generated, and it must source its claims — "based on your notes" vs. "inferred from sector context."

**"I don't want my current employer to know I'm evaluating this."**
CTOs at public companies are especially cautious. They will check whether the app pings external APIs that could be logged, whether the sign-in appears in their Google account history, whether the company email is used. Privacy architecture must be airtight and communicable.

### In-Product Friction

**Enterprise vs. startup context mismatch**
A startup CTO who adds a Series C target company finds the platform optimized for mid-market and enterprise dynamics. The "scan results" return roles titled for enterprise hierarchies. The prep brief advises on transformation mandates that do not apply to a company of 200 people. The product needs startup-mode awareness — either explicit stage detection or at minimum a stage dropdown that influences AI context.

**LinkedIn import misreads technical depth**
CTOs have deep, specific technical contributions that LinkedIn titles do not capture. "CTO at Acme" tells the model nothing about whether the person built the data platform from scratch, scaled to 100M users, or primarily managed the department. The AI prep output is generic because the input is generic. Without a rich "beyond the resume" profile, the brief will not differentiate them.

**The prep brief sounds like a CIO brief**
CTO and CIO are different roles. A CIO is primarily a business-technology integrator. A CTO is often an architect, a technical visionary, or a product-adjacent leader. A prep brief that leads with "transformation mandate" and "business-IT alignment" frames the CTO as a CIO, which many CTOs will find insulting and off-target.

### Critical Failure Mode
A CTO shares the platform with a peer, who discovers a specific factual error or a piece of AI output that contradicts what they know to be true about a company they worked at. CTOs talk to each other constantly. One public criticism in a Slack or Discord where senior engineering leaders congregate can set back B2C acquisition significantly.

### Win Condition
The platform correctly distinguishes what kind of CTO they are and produces a brief that speaks to their specific flavor of the role — infrastructure architect, product-CTO, platform builder, AI/ML leader. The Questions to Ask section surfaces a question that only someone who deeply understands their technical background would think to ask in that interview. That specificity is the proof of value.

---

## VP of Technology

### Search Dynamic
The VP of Technology search is the most common search in the platform's target audience and also the least well-served by the current positioning. VPs are making a lateral move at a better company or a step-up to CIO. The step-up is harder and requires active repositioning, not just a better resume. Many VPs do not know how to position themselves for a CIO role, and the platform can help — but the current content and messaging leans more toward the already-executive audience.

### Pre-Trial Pushback

**"Am I too junior for this platform?"**
The persona page exists (/for-vp) but the overall brand positioning — language like "elite," "campaign infrastructure," images of CIO-level gravity — can make VPs feel like they are buying a product built for someone one level above them. This creates a subtle disqualification. They sign up but they do not believe it was designed for them.

**"I'm not sure I need a campaign. I need a better resume."**
VPs think operationally about job search — resume, LinkedIn, recruiters. The concept of a "search campaign" is a CIO-level mental model. VPs are not yet thinking in terms of 18-month pipelines, search firm relationship mapping, and win thesis construction. The onboarding and positioning must introduce the campaign model as an upgrade from what they know, not assume it as a given.

**"The price feels high for what I'm not sure I'm getting."**
At $129/month, a VP spending 3 months in search pays $387 for prep infrastructure. That is reasonable relative to their compensation ($180-250K) but it requires them to believe the output is worth it. Their ROI frame is: "Will this get me a better job faster?" The answer is yes, but proving it quickly in the product experience is the challenge.

### In-Product Friction

**The prep brief assumes they are already CIO-level**
A VP using the platform to prep for a CIO interview is often still learning how to operate at that level. A brief that treats them as a peer-level interviewer may over-pitch their capabilities and create a brief they do not feel authentic delivering. The brief needs a "transition framing" mode — how to position a VP background for a CIO role without overclaiming.

**"The step-up advice is too generic"**
The positioning challenge for VP-to-CIO is specific: how to reframe operational execution experience as strategic leadership, how to address the "not yet a CIO" objection before it is raised, how to position a smaller-scale transformation as relevant to a larger stage. The platform does not currently have a structured mode for this transition. It gives a prep brief — but the brief may not address the fundamental positioning gap.

**Scan results return CIO roles they are not quite ready for**
If a VP adds a company target, the scan returns CIO roles. But the VP may be targeting a Deputy CIO, VP IT, or Director role as a step. The scan does not currently filter by seniority level within a target company.

### Critical Failure Mode
The VP generates a prep brief for a CIO interview, delivers the framing from the brief, and the interviewer responds with "but you've never been a CIO" — the exact objection the brief should have anticipated and addressed. If the brief surfaced a counter to that objection and the VP used it and it worked, that is conversion-driving. If it didn't address it, that is permanent churn.

### Win Condition
The platform specifically helps them frame their VP experience as CIO-ready. The Anticipated Pushback section identifies "no CIO title" as the primary objection and gives a specific, credible counter. The Narrative section provides a story arc that takes them from "technically strong VP" to "strategically ready CIO" in four sentences. That is something they cannot produce themselves.

---

## Chief Data Officer (CDO)

### Search Dynamic
The CDO search is genuinely harder than any other C-suite search on the platform. The role is inconsistently defined across organizations — at some companies it is a data governance and compliance function, at others it is a data product and analytics function, at others it is effectively a Chief AI Officer. The executive searching for a CDO role must navigate this ambiguity, often repositioning themselves differently for each target.

### Pre-Trial Pushback

**"Does the platform understand what a CDO actually does?"**
CDOs encounter persistent confusion about their role — boards, CEOs, and even hiring search firms frequently conflate Chief Data Officer with Chief Digital Officer, or assume the role is purely technical rather than strategic. The platform's content and prep brief output must demonstrate it understands this nuance. A prep brief that uses CIO framing for a CDO interview immediately signals the platform does not understand the role.

**"There are very few CDO roles at any given time."**
The CDO search pool is significantly smaller than CIO or CTO. A CDO at a Fortune 500 company may be targeting 15-20 companies nationally, not 50-100. The value of company intelligence is high, but the executive knows that most CDO searches are not announced until the incumbent leaves — and sometimes not even then. The platform must frame itself around intelligence that precedes the posting, not the posting itself.

**"Compensation data and role benchmarking don't exist for this function."**
CDOs lack the comp benchmarking that CIOs have (Gartner, Korn Ferry annual surveys, etc.). The platform's ability to help with compensation strategy is limited by this data gap. The executive may correctly identify that the platform's coverage of their function is thinner than for CIO/CTO.

### In-Product Friction

**The AI conflates CDO (data) with CDO (digital)**
If a user identifies as Chief Data Officer, the brief should not use language appropriate for a digital transformation mandate. These are different roles with different interview dynamics, different success metrics, and different candidate profiles. A brief that mixes the two is immediately identified as wrong by a CDO and destroys confidence in the output.

**The win thesis is too vague without clear role definition**
Because the CDO role definition varies so widely by company, the AI cannot construct a credible win thesis without knowing what this specific company means by the role. Without that specification in the company notes, the brief defaults to generic "data strategy" framing that feels like it was written for a LinkedIn bio, not a real interview.

**Scan results return irrelevant roles**
A company career page scan looking for "CDO" may return Chief Digital Officer roles, VP Data roles, or nothing at all (because the role is a retained search not posted publicly). The signal-to-noise ratio for this persona is lower than for CIO/CTO, and the executive will notice.

### Critical Failure Mode
The brief frames them as a Chief Digital Officer when they are a Chief Data Officer. They catch it immediately. They conclude the platform does not understand their function. They cancel.

### Win Condition
The brief demonstrates specific, accurate understanding of the difference between a data strategy mandate and a digital transformation mandate — and frames the executive's background precisely in terms of what this specific company needs from a data leader. A brief that leads with "this company's stated priority is productizing their data as a revenue asset, not just governance — and your work at X directly addresses that" is worth paying for.

---

## Chief Digital Officer (CDO)

### Search Dynamic
Chief Digital Officers occupy an unusual position: their role is frequently created during transformation inflection points and eliminated or merged with CIO or CMO once the transformation is complete. Their search is often driven by industry cycles — retail, healthcare, banking, and insurance are in active transformation phases; manufacturing is entering one. Timing industry cycles correctly is more important for this persona than for any other.

### Pre-Trial Pushback

**"My role might not exist at the company I'm targeting."**
Chief Digital Officers often search companies where the CDO function is undefined or where the board is debating whether to create the role versus elevating an existing function. The executive's pitch is partly "here is why you need this role" and partly "here is why I am the person for it." The prep brief must address this dual mandate.

**"I came from consulting / marketing / operations — will this platform understand my background?"**
Chief Digital Officers frequently come from non-traditional technology backgrounds. A former McKinsey partner running digital transformation, a CMO who built an e-commerce function, an operations leader who digitized a supply chain — these are common CDO profiles. A platform that reads their background through a CIO lens will misframe their story.

### In-Product Friction

**The brief defaults to technology leadership framing**
A CDO whose background is business transformation will receive a brief that emphasizes technology credentials they may not have, or downplays business outcomes they do have. The platform needs to detect whether the user's profile is technology-led or business-led and adjust the framing accordingly.

**Industry cycle context is missing**
The company intelligence for a Chief Digital Officer search must include industry-specific transformation context. A retail CDO target needs context about e-commerce penetration, omnichannel dynamics, and consumer behavior shifts. The generic scan results and signals do not capture this industry texture.

**"What to Leave Out" misses political dynamics**
CDO mandates are often politically contested — the CIO feels threatened, the CMO believes they own digital, the CFO is skeptical of transformation ROI. A prep brief that does not address these internal dynamics is missing the most important preparation element for this role. The executive walks into a room where the internal politics are as important as their credentials.

### Critical Failure Mode
The brief frames them as a technology executive when their actual competitive advantage is business transformation experience. An interviewer who asks "what's your view on the technology stack" is testing whether they understand the technology layer. A brief that prepared them to lead with technology depth when their real advantage is business outcome orientation will cause them to misframe their candidacy.

### Win Condition
The brief correctly identifies that this company is hiring a business transformation leader who happens to have digital fluency — not a technologist who happens to understand business. It frames their non-traditional background as an asset: "You are the only candidate who has operated a P&L and transformed a customer-facing digital experience. Most of the other finalists are engineers who learned business. You are a business leader who learned digital. That matters here."

---

## CISO — Chief Information Security Officer

### Search Dynamic
CISO searches are driven by events: breaches, regulatory actions, board pressure after a competitor incident, compliance requirements (SOC2, HIPAA, SEC cybersecurity rules), or the incumbent's departure. The CISO searching for a role must navigate a market where their candidacy is evaluated through a risk lens — boards are asking "will this person reduce our liability, or are they the kind of CISO who becomes a liability themselves?"

The CISO must also manage extraordinary confidentiality concerns: disclosing too much about their current role's security posture in an interview can constitute a material breach of their NDA and potentially create legal exposure.

### Pre-Trial Pushback

**"I scrutinize authentication flows professionally. That Supabase URL is a red flag."**
This is the most acute version of the OAuth concern across all personas. A CISO evaluating a new SaaS product will examine the sign-in flow the same way they evaluate vendor onboarding at their company. A random supabase.co subdomain in the OAuth consent screen is not a minor inconvenience — it is a disqualifying observation for someone whose job is identifying exactly this kind of trust gap. The custom auth domain (auth.startingmonday.app) must be live and working before this persona is targeted.

**"What does your security architecture look like?"**
A CISO will ask questions that no other persona asks: Where is the data stored? What encryption is used at rest and in transit? Who has access to the database? What is your incident response plan? Is there a SOC2 report? These questions do not have bad answers — Supabase + AWS with encryption at rest is a legitimate answer — but the product must be able to provide them, ideally on a dedicated security page.

**"I can't put details about my current employer's security posture in a third-party tool."**
This is a real and legitimate concern. CISOs who want to use the platform for interview prep on a specific role need to describe their current work. That description could include information that is confidential under their employment agreement. The product must be clear about what is stored, for how long, and provide an easy way to delete sensitive notes.

### In-Product Friction

**The brief asks for context the CISO cannot provide**
The company notes field, used to build the Situation section, asks the executive to describe what they know about the company's security posture and likely needs. A CISO filling this in for a potential employer may inadvertently include intelligence gathered through professional networks that they should not be sharing with a third-party system. The platform needs a clear "notes are stored only for your use and can be deleted at any time" statement proximate to the notes input.

**The prep brief does not address board-level security framing**
CISO interviews at large companies always include a board presentation component or at minimum questions about how to communicate risk to a board. The prep brief must have a specific section on board communication strategy for this persona — it is as important as the Win Thesis.

**The brief conflates CISO roles by industry**
A financial services CISO (regulatory compliance dominant, SOX, FFIEC), a healthcare CISO (HIPAA, breach liability), and a technology company CISO (product security, secure SDLC, bug bounty) are doing fundamentally different jobs. The prep brief must identify the dominant security framework for the target industry and frame the executive's background accordingly.

**The "confidentiality" language on the site is not specific enough for this audience**
"Your search stays invisible. We never share your identity, your targets, or your activity with employers, recruiters, or anyone else." This is correct but insufficient for a CISO. They want technical specificity: what data model, what access controls, what deletion guarantees. A one-paragraph security statement on the privacy page would meaningfully improve conversion for this persona.

### Critical Failure Mode
The CISO discovers — through examining network traffic, reviewing the OAuth flow, or simply noticing the Supabase URL — a trust gap in the product's security architecture. They share this observation with other CISOs (this community is extremely tight-knit and communicates primarily through private channels). The observation spreads to a community where the target audience is concentrated. The damage to conversion in this persona is acute and fast.

### Win Condition
The brief correctly frames the executive's background in terms of risk reduction — not technical achievement, risk reduction. "You have reduced material breach risk by X% in two successive organizations. That is what this board is buying. Every question in this interview is really the same question: will you make us safer or will you become the problem?" That framing — which most CISOs know intuitively but struggle to articulate — is worth paying for.

---

## CPO — Chief Product Officer

### Search Dynamic
CPO searches are among the most relationship-driven in the C-suite outside of pure founder-CEO networks. CPOs are hired because a CEO trusts their product philosophy and believes they will build the right thing. The interview process evaluates taste, judgment, and cultural fit as much as technical product management skills. A CPO who optimizes for credential signaling over authentic conversation is making a fundamental error.

CPO searches also bifurcate sharply: a B2C CPO (consumer product, growth, engagement metrics) and a B2B CPO (enterprise product, customer success alignment, roadmap governance) have different interview dynamics, different success metrics, and different candidate profiles.

### Pre-Trial Pushback

**"I will evaluate this product as a product person."**
CPOs will do a rigorous product teardown before they pay for anything. They will assess: Is the onboarding clear? Does the first session deliver value? Is the UI earning trust or creating friction? What is the activation rate of this product's own features? If the product does not meet their professional standard, they will not use it — not because it is not useful, but because using an inferior product is inconsistent with their professional identity.

**"The prep brief is going to be generic."**
CPOs have heard generic interview advice for their entire careers. They know the frameworks — CIRCLES, Jobs to Be Done, roadmap prioritization, stakeholder management. They do not need those rehashed. What they need is a prep brief that is so specific to this company's product challenges that it reveals something they had not already thought of. That bar is high and it must be met.

**"The LinkedIn import will get my product work wrong."**
Product work is notoriously difficult to represent on LinkedIn. "Led product for consumer growth" tells the AI nothing about whether the person doubled DAU, launched a new monetization model, or repositioned the product for a new market. Without rich input, the output is useless. The onboarding must push CPOs to provide deep qualitative context about their most important work.

### In-Product Friction

**The prep brief reads like a CIO brief with product language overlaid**
The prompt structure — Win Thesis, Anticipated Pushback, Questions to Ask — is correct. But the content defaults to executive leadership and transformation language that fits CIOs better than CPOs. A CPO brief should lead with product philosophy, product-market fit insight, roadmap judgment, and organizational design for product teams. The system prompt for CPO context needs significant differentiation.

**B2C vs. B2B CPO framing is often wrong**
A B2B CPO being briefed for a B2C role, or vice versa, will receive a brief that misframes their competitive advantage. The platform needs to detect product type from company and role context and adjust accordingly.

**The Questions to Ask section asks operational questions, not product questions**
A CPO's most powerful interview move is asking a question that reveals product insight — "I noticed your NPS has been flat despite feature volume increasing. What's your hypothesis on why?" The platform tends to produce executive-level strategic questions that a CPO might ask but that are less distinctive than the product-specific questions that would differentiate them.

**The daily briefing is not tuned for CPO signals**
CPO searches benefit from product-specific intelligence: app store review trends, competitor feature launches, public product announcements, customer feedback signals. The current briefing is optimized for organizational/leadership signals. For CPOs, product signals are equally important.

### Critical Failure Mode
The CPO generates a brief, evaluates it professionally, finds it generic, and immediately concludes the product is not worth the subscription. CPOs with large Twitter/LinkedIn followings may share this opinion. This is the persona most likely to write a public critique — and most likely to be influential if they do.

### Win Condition
The brief produces a specific, accurate insight about the target company's product situation that the CPO had not already identified. "Their mobile retention curve suggests a core loop problem, not an acquisition problem. Every question about your experience should be answered through that lens." That observation — drawn from the company's public signals — is the proof of value. The CPO thinks: "How did it know that?" and immediately understands why the platform is worth using.

---

## COO — Chief Operating Officer

### Search Dynamic
COO searches are the least standardized of any C-suite role. The COO's mandate varies more by company than any other executive position — at some companies it is a number-two-to-the-CEO role, at others it is a head of operations, at others it is a CFO-adjacent function, at others it is a de facto chief of staff. The search often involves creating or shaping the role definition rather than filling a predefined mandate.

COO searches are also frequently invisible. Many COO mandates are created when a CEO identifies a specific operational challenge — scaling international, professionalizing a founder-led company, managing post-M&A integration — and then finds the person who has solved exactly that problem before.

### Pre-Trial Pushback

**"I'm not a technology executive. Is this platform for me?"**
The Starting Monday brand and positioning leans heavily toward technology functions. A COO from an operations, finance, or general management background may feel the product was built for someone with a technology identity. The /for-coo persona page exists but it must work harder to signal that the platform serves operational excellence, not just technology leadership.

**"My search is entirely relationship-driven."**
COOs are correct that their searches are driven by CEO relationships, board connections, and PE sponsor networks rather than company intelligence or posted roles. The platform's scan and intelligence features are less relevant to them. The primary value is pipeline management (tracking every conversation, every referral, every search firm contact) and prep (because COO interviews are idiosyncratic and challenging to prepare for systematically).

**"The company intelligence features don't apply to how I search."**
A COO is not waiting for a company career page to post "COO - scaling operations for hypergrowth." Those roles are not posted. They are created. The scan feature, which is the product's most defensible intelligence capability, is largely irrelevant to this persona. The value proposition must be repositioned around relationship tracking and prep brief quality.

### In-Product Friction

**The prep brief is too technology-leadership-forward**
A COO brief should emphasize operational transformation, organizational design, process optimization, financial discipline, and CEO partnership. The default prep brief framing leans on technology transformation language that is off-target for a non-technology COO. The system prompt for COO context must be substantially differentiated.

**The company notes field is designed for technology intelligence**
"Sector," "stage," and "notes" are reasonable fields for a CIO researching a target company. A COO researching a target is thinking differently: What is the company's operational maturity? Where are the process gaps? What is the CEO's style? What is the board's mandate? The intelligence framework needs to support operational diagnosis, not just technology org signals.

**The briefing is not calibrated for operational signals**
The daily briefing for a COO should surface: revenue and EBITDA trajectory signals, operational announcements (supply chain changes, location openings/closures, hiring patterns in operations functions), M&A activity (integration challenges create COO mandates). The current briefing surfaces technology-org signals that are less relevant.

**The "Also built for" persona selector surfaces adjacent executive types but the COO journey is distinct**
When a COO lands on the platform and sees CIO, CTO, CISO, CDO, CPO in the persona list, the implicit message is "this platform serves technology executives and COO was added as an afterthought." If the COO journey is worth building, it needs to be built with COO-specific language throughout — not just a persona page.

### Critical Failure Mode
A COO generates a brief that reads like it was written for a CIO, uses technology transformation language that does not reflect their background, and produces a Win Thesis that they cannot credibly deliver in a room with a CEO and board chair. They conclude the platform does not understand their role. Because COO searches are small and high-touch, one COO sharing this experience with peers through a CEO network can have outsized negative effects.

### Win Condition
The brief correctly identifies that this COO's competitive advantage is not technology — it is operational execution and CEO partnership. The Win Thesis says something like: "You have scaled three companies through the $100M-$500M inflection, which is exactly the operational challenge this company is facing in the next 18 months. The CEO does not need a technology leader — they need someone who has already navigated this specific phase and can be a genuine partner through it." That is precise, is not tech-forward, and is deliverable. That is a brief worth paying for.

---

## Cross-Cutting Product Priorities

Ranked by frequency and severity of impact across personas:

### Priority 1 — AI output accuracy on career history
Affects: Every persona. The LinkedIn import creates inaccuracies that propagate into every AI output. The first generation of any AI-produced content using wrong input destroys trust permanently for this audience. Fix: structured post-import verification flow that asks the executive to confirm key facts before the first brief is generated.

### Priority 2 — Role-specific AI differentiation
Affects: CDO, CISO, CPO, COO most acutely. The prep brief prompt must detect persona and adjust framing, vocabulary, success metrics, and interview dynamics accordingly. A CIO brief, a CDO brief, and a COO brief should read like they were written by different experts for different roles — not like the same template with different names filled in.

### Priority 3 — "No job posting found" language and behavior
Affects: All personas, CIO most immediately. The message must be replaced with informative intelligence: "No public posting found — likely filled through retained search. Here is what we know about the likely mandate." And the job posting URL input (just implemented) must be prominently visible.

### Priority 4 — CISO security architecture transparency
Affects: CISO primarily, but security-conscious executives across all personas. A dedicated security page detailing encryption, data storage, access controls, and deletion guarantees. This is also an exit readiness asset — buyers doing due diligence will ask.

### Priority 5 — Confidentiality architecture clarity
Affects: All personas, with CIO and CISO most sensitive. The "Your search stays invisible" statement is the right direction but needs to become more specific — not just what we do not share, but what is stored, in what form, and how to delete it. Technical credibility matters to this audience.

### Priority 6 — COO and CPO brief differentiation
Affects: COO and CPO. Currently the most underserved personas in terms of brief quality. Neither role is a technology-leadership role and the prep brief must reflect that structurally, not just in surface language.
