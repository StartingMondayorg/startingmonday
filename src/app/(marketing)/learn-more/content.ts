export type LearnMoreCitation = {
  id: number
  claim: string
  source: string
  href: string
  external?: boolean
}

export type LearnMoreCard = {
  title: string
  body: string
  citations?: number[]
}

export type LearnMoreQuestion = {
  question: string
  answer: string
  citations?: number[]
}

export const LEARN_MORE_CITATIONS: LearnMoreCitation[] = [
  {
    id: 1,
    claim: 'Starting Monday often sees role-shaping signals 1-3 weeks before broad-market channels.',
    source: 'Internal timing model with source notes and SEC timing context.',
    href: '/blog/how-we-estimate-early-role-signals',
  },
  {
    id: 2,
    claim: 'Prep briefs generate in about a minute with role-specific structure: win thesis, likely objections, and peer-level questions.',
    source: 'Product mechanics, verifiable in the live demo.',
    href: '/demo',
  },
  {
    id: 3,
    claim: 'Starting Monday often sees role-shaping signals 1-3 weeks before broad-market channels.',
    source: 'Internal timing model with source notes and SEC timing context.',
    href: '/blog/how-we-estimate-early-role-signals',
  },
  {
    id: 4,
    claim: 'Coaching outcomes improve when the mechanism and context between sessions are made explicit.',
    source: 'Ely et al. research summary cited in Starting Monday method materials.',
    href: '/method-and-evidence',
  },
  {
    id: 5,
    claim: 'Concrete implementation plans outperform vague intent when behavior must happen under uncertainty.',
    source: 'Gollwitzer implementation-intentions research cited in Starting Monday method materials.',
    href: '/method-and-evidence',
  },
  {
    id: 6,
    claim: 'Structured onboarding and transition processes reduce ambiguity and improve early-role outcomes.',
    source: 'Bauer et al. transition research cited in Starting Monday method materials.',
    href: '/method-and-evidence',
  },
  {
    id: 7,
    claim: 'Weak signals are valuable because they surface directional change before formal confirmation is obvious to the market.',
    source: 'Ansoff weak-signal framing cited in Starting Monday method materials.',
    href: '/method-and-evidence',
  },
  {
    id: 8,
    claim: 'Shared visibility between sessions helps shift coaching time from recap to higher-value strategy work.',
    source: 'Bozer and Jones coaching-effectiveness summary cited in Starting Monday method materials.',
    href: '/method-and-evidence',
  },
]

export const BLUF_POINTS: LearnMoreCard[] = [
  {
    title: 'Why it is different',
    body: 'Starting Monday is not a job board helper. It is an operating system for finding signal early, shaping the right narrative, and building the right relationships before a search turns noisy.',
    citations: [3, 4, 7, 8],
  },
  {
    title: 'Why it matters',
    body: 'Senior searches are won in the period when the role is still taking shape and relationship paths are still warm. Entering during that window changes the conversation quality and the shortlist outcome.',
    citations: [3, 5, 7],
  },
  {
    title: 'What changes for the user',
    body: 'Instead of reacting to postings, the user runs one weekly system: monitor movement, sharpen positioning, take the next relationship action, and prepare for the conversation that follows.',
    citations: [2, 4, 5, 8],
  },
]

export const COMPARISON_ROWS = [
  {
    area: 'Timing',
    typical: 'Enters after a posting and competes in the most crowded window.',
    startingMonday: 'Enters when the role is still taking shape and the market has not fully converged.',
    citations: [3, 7],
  },
  {
    area: 'Narrative',
    typical: 'Polishes a resume and profile for broad applicant visibility.',
    startingMonday: 'Builds a role-specific story for board, PE, search-firm, and executive audiences.',
    citations: [4, 5],
  },
  {
    area: 'Targeted relationships',
    typical: 'Treats networking like generalized volume.',
    startingMonday: 'Focuses on the small group of people who can shape access, context, or timing for a given role.',
    citations: [5, 8],
  },
  {
    area: 'Execution',
    typical: 'Relies on bursts of effort, then stalls while opportunities go quiet.',
    startingMonday: 'Runs a weekly cadence tied to momentum, follow-through, and conversation readiness.',
    citations: [2, 5, 8],
  },
  {
    area: 'Preparation',
    typical: 'Prepares late and generically.',
    startingMonday: 'Builds role-specific briefs, likely objections, and peer-level questions before each high-stakes conversation.',
    citations: [1, 4, 6],
  },
]

export const TARGETED_RELATIONSHIP_CARDS: LearnMoreCard[] = [
  {
    title: 'Search-firm and recruiter paths',
    body: 'We focus on the intermediaries who can decide whether your name moves from interesting to worth introducing now.',
    citations: [3, 8],
  },
  {
    title: 'Board, PE, and operating-partner paths',
    body: 'We help the user reach the people who can assess role fit, not just the people who can pass along a resume.',
    citations: [4, 5],
  },
  {
    title: 'Executive peer and warm-introduction paths',
    body: 'We rank the relationship moves that create context, trust, and timing advantage instead of superficial activity.',
    citations: [2, 5, 8],
  },
]

export const SYSTEM_ARTICLE_SECTIONS: LearnMoreCard[] = [
  {
    title: 'Proprietary intelligence scanner',
    body: 'The scanner watches for role-shaping movement across company, leadership, and market signals so the user can see a situation before a public posting tells everyone else the same story.',
    citations: [3, 7],
  },
  {
    title: 'Proprietary pattern-recognition engine',
    body: 'The engine does not treat each signal as a disconnected alert. It looks for combinations that suggest urgency, leadership change, budget movement, or role expansion so attention goes to the patterns that matter.',
    citations: [3, 7],
  },
  {
    title: 'Relationship momentum algorithm',
    body: 'The algorithm favors the next relationship action most likely to create forward motion: reconnect, request an introduction, follow up with context, or prepare a better conversation opening.',
    citations: [2, 5, 8],
  },
  {
    title: 'Behavior-first operating model',
    body: 'We care about behaviors because outcomes in executive transition are driven by what gets done consistently between conversations. The product is designed to turn intent into repeatable action.',
    citations: [4, 5, 8],
  },
  {
    title: 'Role-specific narrative system',
    body: 'We help the user stay precise for each audience without drifting into different stories for recruiters, board members, operators, or hiring executives.',
    citations: [4, 5],
  },
  {
    title: 'Confidential, low-noise workflow',
    body: 'The experience is built to preserve privacy, reduce reactive behavior, and keep the user in a calm weekly decision rhythm rather than a public-search posture.',
    citations: [4, 6, 8],
  },
  {
    title: 'Proof discipline',
    body: 'We publish methodology notes, denominator-aware pilot claims, and source-linked references because premium trust requires visible evidence, not just persuasive copy.',
    citations: [1, 2],
  },
]

export const OBJECTIONS: LearnMoreQuestion[] = [
  {
    question: 'Is this just another jobs tool?',
    answer: 'No. It is an operating system for timing, narrative, and relationship momentum before public posting windows become crowded.',
    citations: [3, 7],
  },
  {
    question: 'Will this add complexity to my search?',
    answer: 'It removes scattered tools and replaces them with one weekly rhythm: signal, brief, relationship action, and follow-through.',
    citations: [2, 5, 8],
  },
  {
    question: 'Is my search visible to employers?',
    answer: 'No. The product is designed around private monitoring and explicit collaboration rather than public-search broadcasting.',
    citations: [4, 6],
  },
  {
    question: 'What if I already have LinkedIn Premium, a CRM, and a coach?',
    answer: 'Those tools solve adjacent problems. Starting Monday is the operating layer that turns signal, positioning, and coaching into a disciplined transition process.',
    citations: [4, 8],
  },
  {
    question: 'Will the signals be actionable or just interesting?',
    answer: 'The product is built to convert movement into a next step, not another unread alert. That is why the cadence matters as much as the scanner.',
    citations: [3, 5],
  },
  {
    question: 'Do I need a large network for this to work?',
    answer: 'No. The goal is to identify the right paths, not the largest number of contacts. Precision matters more than visible reach in executive transitions.',
    citations: [5, 8],
  },
  {
    question: 'Can this help if I am early in my search and not ready to reach out yet?',
    answer: 'Yes. Early setup is where the system is strongest because it creates signal visibility and narrative clarity before urgency forces weak decisions.',
    citations: [3, 6],
  },
  {
    question: 'How is this different from generic AI career tools?',
    answer: 'Generic tools produce outputs. Starting Monday is built around role-specific context, relationship decisions, and executive-grade preparation.',
    citations: [4, 5],
  },
  {
    question: 'Will this still matter once I have active interviews?',
    answer: 'Yes. The system becomes more valuable as stakes rise because momentum, objection handling, and preparation discipline matter more late in the process.',
    citations: [1, 4, 6],
  },
  {
    question: 'How do I know the claims are real?',
    answer: 'The public proof set includes denominator-aware pilot metrics, source-linked methodology, and references pages that map claims to evidence.',
    citations: [1, 2],
  },
]

export const COMMON_QUESTIONS: LearnMoreQuestion[] = [
  {
    question: 'How quickly can I see useful signals?',
    answer: 'Most users see useful movement soon after target setup because the value starts with monitoring, not only with outreach.',
    citations: [2, 3],
  },
  {
    question: 'What exactly is in a brief?',
    answer: 'A good brief includes role context, likely objections, questions to ask, and the positioning angle that should open the conversation.',
    citations: [1, 4],
  },
  {
    question: 'Who is this best for?',
    answer: 'It is best for private leadership transitions where relationship paths and timing matter more than public application volume.',
    citations: [3, 6],
  },
  {
    question: 'Does this replace my coach, recruiter, or CRM?',
    answer: 'No. It supports the operating work around them so each of those relationships can be more effective.',
    citations: [4, 8],
  },
  {
    question: 'Why does the product focus so much on behavior?',
    answer: 'Because intention is cheap and consistency is rare. Executive transitions improve when the right actions keep happening between high-stakes moments.',
    citations: [4, 5, 8],
  },
  {
    question: 'What kinds of signals are most valuable?',
    answer: 'Signals that suggest a role is changing, a leader is leaving, budget is moving, or a new executive capability is needed.',
    citations: [3, 7],
  },
  {
    question: 'How many target companies should I watch?',
    answer: 'Enough to create real option value, but not so many that you dilute attention and relationship quality.',
    citations: [5, 8],
  },
  {
    question: 'Can I use it if I am currently employed and need confidentiality?',
    answer: 'Yes. The product is specifically designed for low-visibility transitions and private search behavior.',
    citations: [4, 6],
  },
  {
    question: 'What is relationship momentum?',
    answer: 'It is the rate at which the right conversations move forward because context, timing, and follow-through are handled well.',
    citations: [2, 5, 8],
  },
  {
    question: 'Does it help after the role is posted?',
    answer: 'Yes, but the edge is strongest before the market gets crowded because that is when timing and targeted relationships matter most.',
    citations: [3, 7],
  },
  {
    question: 'How is the narrative system different from resume tuning?',
    answer: 'It is built for decision-makers and role context, not just for applicant-document polish.',
    citations: [4, 5],
  },
  {
    question: 'Can I collaborate with a coach or advisor?',
    answer: 'Yes. The model is designed so trusted collaborators can work from the same context instead of rebuilding it every session.',
    citations: [4, 8],
  },
  {
    question: 'What does the pattern-recognition engine actually do?',
    answer: 'It highlights combinations of movement that change search probability, so the user acts on patterns rather than isolated noise.',
    citations: [3, 7],
  },
  {
    question: 'Is this mainly for technology executives?',
    answer: 'The current public narrative is strongest there, but the underlying operating logic is about senior transitions more broadly.',
    citations: [4, 6],
  },
  {
    question: 'How should I think about ROI?',
    answer: 'ROI comes from better timing, sharper preparation, and fewer stalled relationship threads during a high-value transition.',
    citations: [1, 2, 3],
  },
  {
    question: 'What if I only need interview prep?',
    answer: 'The platform can help there, but it is strongest when prep is connected to signal, narrative, and relationship context.',
    citations: [1, 4],
  },
  {
    question: 'What if my market moves slowly?',
    answer: 'Slow markets still reward preparation and early context because they create fewer but more consequential moments to act.',
    citations: [5, 6],
  },
  {
    question: 'How do I know what to do each week?',
    answer: 'The system is designed to reduce the week to a small set of decisive actions rather than an unbounded task list.',
    citations: [2, 5, 8],
  },
  {
    question: 'Why do you publish source notes publicly?',
    answer: 'Because premium trust depends on showing how claims were formed, where they came from, and what confidence level they deserve.',
    citations: [1, 2],
  },
  {
    question: 'What happens if my search direction changes?',
    answer: 'That is expected. The value of the system is that it helps the user re-evaluate targets, narrative, and relationships without losing context.',
    citations: [4, 6, 8],
  },
]

export const TOP_OBJECTIONS = OBJECTIONS.slice(0, 5)
export const TOP_COMMON_QUESTIONS = COMMON_QUESTIONS.slice(0, 5)
