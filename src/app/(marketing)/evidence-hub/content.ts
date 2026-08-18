/**
 * Evidence Hub Content
 * 
 * Comprehensive research taxonomy explaining WHY and WHAT we do,
 * grounded in peer-reviewed, industry, and foundational research.
 * 
 * Structure: Not a how-to, but a credibility & reasoning framework
 * that differentiates the product through research rigor.
 */

export type EvidenceSection = {
  id: string
  title: string
  subtitle: string
  overview: string
  whyItMatters: string
  keyInsights: EvidenceInsight[]
}

export type EvidenceInsight = {
  claim: string
  sources: EvidenceSource[]
  implication: string
}

export type EvidenceSource = {
  id: string
  type: 'academic' | 'business' | 'book' | 'internal'
  authors?: string
  title: string
  publication?: string
  year?: number
  doi?: string
  url?: string
  keyFinding: string
}

/**
 * SECTION 1: INTRODUCTION
 * Why research-based product development matters for executive transitions
 */
export const EVIDENCE_INTRODUCTION = {
  headline: 'Built on research. Not hunches.',
  subheadline: 'Why evidence-based product development matters in executive transitions',
  summary: `
    Most executive-search tools are built on assumptions: that visibility equals opportunity, 
    that timing is random, that preparation can happen late. Starting Monday is built on evidence.
    
    Every feature and decision is grounded in peer-reviewed research, industry data, and 
    first-principles thinking about executive transitions. This isn't about being academic - it's about 
    being effective.
    
    When stakes are high and timing is narrow, working from evidence beats working from instinct.
  `,
  whyResearchMatters: `
    Executive transitions are complex decision-making moments that happen infrequently for any individual.
    That scarcity means intuition and past experience are unreliable guides. Research-based design means:
    
    - Identifying which signals actually matter (vs. which just feel interesting)
    - Understanding what makes relationship momentum stick (vs. activity that stalls)
    - Building workflows that turn intention into consistent action
    - Preparing for conversations at the depth where senior hiring actually happens
    
    The research below shows what we know about how executives transition successfully, 
    how coaching actually improves outcomes, when role-shaping signals appear, 
    and why behavior consistency beats sporadic effort.
  `,
}

/**
 * SECTION 2: EARLY ROLE SIGNALS & MARKET TIMING
 * Why detecting transition signals early changes outcomes
 */
export const EVIDENCE_EARLY_SIGNALS: EvidenceSection = {
  id: 'early-signals',
  title: 'Early Role Signals',
  subtitle: 'Why transition signals appear weeks before market convergence',
  overview: `
    Executive transitions move through predictable phases: private uncertainty, subtle positioning, 
    formal announcement, public search. Each phase has its own signals. Starting Monday uses a proprietary 
    system to separate meaningful role signals from market noise, then validates the pattern before anything 
    is surfaced. The leaders who win move during the early phases, when options are still forming and access is still warm.
  `,
  whyItMatters: `
    The difference between finding a role during weak-signal phase vs. posted-job phase is not just timing-
    it's decision quality. Early in a transition, decision-makers are still gathering context, building 
    the shortlist in their heads, and forming perceptions. That's when an executive with clear value and 
    strong prior relationships can shape how the role itself is defined.

    We disclose the evidence categories and validation standards, but not the exact weighting or trigger 
    logic. That keeps the signal useful without giving away the engine. Starting Monday is built to turn 
    noisy public information into decisive action, so leaders can move earlier with better context.
  `,
  keyInsights: [
    {
      claim: 'Market microstructure creates signal drift before formal announcements',
      sources: [
        {
          id: 'spence-1973',
          type: 'academic',
          authors: 'Spence, M.',
          title: 'Job market signaling',
          publication: 'The Quarterly Journal of Economics',
          year: 1973,
          doi: 'https://doi.org/10.2307/1882010',
          keyFinding: 'Signals reduce information asymmetry in hiring markets; asymmetry is profitable for those with early information'
        },
        {
          id: 'akerlof-1970',
          type: 'academic',
          authors: 'Akerlof, G.A.',
          title: 'The market for "lemons": Quality uncertainty and the market mechanism',
          publication: 'The Quarterly Journal of Economics',
          year: 1970,
          doi: 'https://doi.org/10.2307/1879431',
          keyFinding: 'Asymmetric information distorts market outcomes; when information is private, early movers have structural advantage'
        },
      ],
      implication: 'Executives who detect signals before broad-market convergence have time to position, gather context, and build relationships before the search becomes crowded.'
    },
    {
      claim: 'Stock-price and governance moves precede CEO turnover announcements',
      sources: [
        {
          id: 'warner-1988',
          type: 'academic',
          authors: 'Warner, J.B., Watts, R.L., & Wruck, K.H.',
          title: 'Stock prices and top management changes',
          publication: 'Journal of Financial Economics',
          year: 1988,
          doi: 'https://doi.org/10.1016/0304-405X(88)90054-2',
          keyFinding: 'Equity markets react around (and before) management change events, indicating information is partially incorporated early'
        },
        {
          id: 'huson-2001',
          type: 'academic',
          authors: 'Huson, M.R., Parrino, R., & Starks, L.T.',
          title: 'Internal monitoring mechanisms and CEO turnover: A long-term perspective',
          publication: 'The Journal of Finance',
          year: 2001,
          doi: 'https://doi.org/10.1111/0022-1082.00405',
          keyFinding: 'Internal governance/monitoring structures significantly shape turnover probability; early signals appear in board and control-system changes'
        },
      ],
      implication: 'Performance stress, governance changes, and board actions are leading indicators for executive transitions. These signals surface weeks or months before formal announcements.'
    },
    {
      claim: 'Board context and firm performance shape transition probability in measurable ways',
      sources: [
        {
          id: 'parrino-1997',
          type: 'academic',
          authors: 'Parrino, R.',
          title: 'CEO turnover and outside succession: A cross-sectional analysis',
          publication: 'Journal of Financial Economics',
          year: 1997,
          doi: 'https://doi.org/10.1016/S0304-405X(97)00028-7',
          keyFinding: 'Poor firm performance and governance context are strongly associated with turnover and outsider succession'
        },
        {
          id: 'jenter-2015',
          type: 'academic',
          authors: 'Jenter, D., & Kanaan, F.',
          title: 'CEO turnover and relative performance evaluation',
          publication: 'The Journal of Finance',
          year: 2015,
          doi: 'https://doi.org/10.1111/jofi.12282',
          keyFinding: 'Boards respond to both firm-specific and peer-relative performance; transitions are predictable from comparative benchmarks'
        },
      ],
      implication: 'Transitions aren\'t random events. They follow measurable conditions: underperformance, governance change, new strategic direction. Executives who monitor these conditions can detect probability shifts before others.'
    },
    {
      claim: 'Weak signals matter because they surface directional change before formal confirmation',
      sources: [
        {
          id: 'sm-internal-timing',
          type: 'internal',
          title: 'How we estimate early role signals',
          publication: 'Starting Monday blog',
          url: '/blog/how-we-estimate-early-role-signals',
          keyFinding: 'Starting Monday detects role-shaping signals 1-3 weeks before broad-market channels; weak signal detection is the primary value'
        },
      ],
      implication: 'The window between when insiders know a transition is coming and when it becomes public is narrow but valuable. Leaders who move during that window get better outcomes.'
    },
  ],
}

/**
 * SECTION 3: EXECUTIVE COACHING & OUTCOMES
 * Why coaching effectiveness depends on mechanism, context, and execution
 */
export const EVIDENCE_COACHING: EvidenceSection = {
  id: 'coaching-effectiveness',
  title: 'Executive Coaching & Performance',
  subtitle: 'Why coaching works and when it doesn\'t',
  overview: `
    Executive coaching is one of the few high-leverage interventions available during major transitions.
    But not all coaching is equal. The research shows what drives coaching ROI: clarity of mechanism, 
    explicit context between sessions, accountability, and behavior follow-through.
  `,
  whyItMatters: `
    A new executive role is high-stress, high-visibility, and unforgiving. The first 90 days set 
    trajectories that are hard to reset. Research on executive coaching shows it can meaningfully 
    improve outcomes - but only when it's structured around actual behavior change, not just advice 
    or emotional support.
  `,
  keyInsights: [
    {
      claim: 'Coaching produces measurable improvements in performance, wellbeing, and coping',
      sources: [
        {
          id: 'theeboom-2014',
          type: 'academic',
          authors: 'Theeboom, T., Beersma, B., & van Vianen, A.E.M.',
          title: 'Does coaching work? A meta-analysis on the effects of coaching on individual-level outcomes in an organizational context',
          publication: 'The Journal of Positive Psychology',
          year: 2014,
          doi: 'https://doi.org/10.1080/17439760.2013.837499',
          keyFinding: 'Meta-analysis across multiple studies shows positive effects of coaching across performance, wellbeing, and coping outcomes'
        },
        {
          id: 'jones-2016',
          type: 'academic',
          authors: 'Jones, R.J., Woods, S.A., & Guillaume, Y.R.F.',
          title: 'The effectiveness of workplace coaching: A meta-analysis of learning and performance outcomes from coaching',
          publication: 'Journal of Occupational and Organizational Psychology',
          year: 2016,
          doi: 'https://doi.org/10.1111/joop.12119',
          keyFinding: 'Workplace coaching is associated with improvements in skills and work performance; effect sizes are medium to large'
        },
      ],
      implication: 'Coaching works. The question is not whether to use it, but how to structure it for maximum ROI during a transition.'
    },
    {
      claim: 'Coaching outcomes depend on relationship quality, self-efficacy, and explicit mechanisms',
      sources: [
        {
          id: 'dehaan-2013',
          type: 'academic',
          authors: 'de Haan, E., Duckworth, A., Birch, D., & Jones, C.',
          title: 'Executive coaching outcome research: The contribution of common factors such as relationship, personality match, and self-efficacy',
          publication: 'Consulting Psychology Journal: Practice and Research',
          year: 2013,
          doi: 'https://doi.org/10.1037/a0031635',
          keyFinding: 'Coaching relationship quality and self-efficacy are major outcome drivers; explicit mechanism clarity matters'
        },
        {
          id: 'sm-coaching-mechanism',
          type: 'internal',
          title: 'Coaching outcomes improve when the mechanism and context between sessions are made explicit',
          publication: 'Starting Monday method materials',
          url: '/method-and-evidence',
          keyFinding: 'When coaching is grounded in explicit goals, observed behavior patterns, and clear next actions, outcomes improve materially'
        },
      ],
      implication: 'The best coaching doesn\'t just provide advice. It makes the mechanism explicit, builds on observed behavior, and ensures follow-through between sessions.'
    },
    {
      claim: 'Coaching linked to sustained improvement in multisource feedback and peer perception',
      sources: [
        {
          id: 'smither-2003',
          type: 'academic',
          authors: 'Smither, J.W., London, M., Flautt, R., Vargas, Y., & Kucine, I.',
          title: 'Can working with an executive coach improve multisource feedback ratings over time? A quasi-experimental field study',
          publication: 'Personnel Psychology',
          year: 2003,
          doi: 'https://doi.org/10.1111/j.1744-6570.2003.tb00142.x',
          keyFinding: 'Coaching linked to greater improvement in multisource ratings over time; effect is sustained at follow-up'
        },
      ],
      implication: 'Coaching\'s impact isn\'t just internal - it changes how peers and direct reports perceive an executive. That\'s crucial for new-role credibility.'
    },
    {
      claim: 'What coaches actually do for you: improve decision quality, accelerate insight, build accountability',
      sources: [
        {
          id: 'hbr-coutu-2009',
          type: 'business',
          authors: 'Coutu, D., & Kauffman, C.',
          title: 'What Can Coaches Do for You?',
          publication: 'Harvard Business Review',
          year: 2009,
          url: 'https://hbr.org/2009/01/what-can-coaches-do-for-you',
          keyFinding: 'High-value coaching focuses on decision quality under uncertainty, not on being liked or feeling supported'
        },
      ],
      implication: 'Coaching isn\'t counseling. It\'s a structured process for improving decision quality when stakes are high and time is scarce.'
    },
  ],
}

/**
 * SECTION 4: ONBOARDING & TRANSITION SUCCESS
 * Why first 90 days matter more than most executives realize
 */
export const EVIDENCE_ONBOARDING: EvidenceSection = {
  id: 'transition-success',
  title: 'Executive Onboarding & Transition',
  subtitle: 'Why the first 90 days shape long-term outcomes',
  overview: `
    A new executive role starts in a cone of uncertainty: unclear expectations, incomplete context, 
    competing stakeholder needs, and high visibility. How an executive navigates that cone predicts 
    whether the transition succeeds or stalls.
  `,
  whyItMatters: `
    The research on executive transitions is clear: the first 90 days are disproportionately important. 
    Outcomes set during this period are difficult to change later. Executives who structure their early 
    days around role clarity, stakeholder alignment, and quick wins outperform those who wing it.
  `,
  keyInsights: [
    {
      claim: 'Role clarity, social acceptance, and learning are the strongest predictors of successful adjustment',
      sources: [
        {
          id: 'bauer-2007',
          type: 'academic',
          authors: 'Bauer, T.N., Bodner, T., Erdogan, B., Truxillo, D.M., & Tucker, J.S.',
          title: 'Newcomer adjustment during organizational socialization: A meta-analytic review of antecedents, outcomes, and methods',
          publication: 'Journal of Applied Psychology',
          year: 2007,
          doi: 'https://doi.org/10.1037/0021-9010.92.3.707',
          keyFinding: 'Role clarity, social acceptance, and learning strongly predict successful adjustment; these can be deliberately engineered'
        },
      ],
      implication: 'Successful transitions aren\'t luck. They result from deliberate focus on understanding the role, building relationships, and learning the context quickly.'
    },
    {
      claim: 'Structured socialization resources materially improve newcomer outcomes',
      sources: [
        {
          id: 'saks-2012',
          type: 'academic',
          authors: 'Saks, A.M., & Gruman, J.A.',
          title: 'Getting Newcomers On Board: A Review of Socialization Practices and Introduction to Socialization Resources Theory',
          publication: 'The Oxford Handbook of Organizational Socialization',
          year: 2012,
          doi: 'https://doi.org/10.1093/oxfordhb/9780199763672.013.0003',
          keyFinding: 'Structured onboarding resources (mentors, guides, check-ins) significantly improve newcomer adjustment and productivity'
        },
      ],
      implication: 'Leaving onboarding to chance is a common mistake. Executives who design their first 90 days deliberately outperform those who react to what comes.'
    },
    {
      claim: 'Successor type and post-succession team changes shape performance outcomes',
      sources: [
        {
          id: 'shen-2002',
          type: 'academic',
          authors: 'Shen, W., & Cannella, A.A.',
          title: 'Revisiting the performance consequences of CEO succession',
          publication: 'Academy of Management Journal',
          year: 2002,
          doi: 'https://doi.org/10.2307/3069306',
          keyFinding: 'Successor type, insider vs. outsider dynamics, and team changes significantly predict post-succession performance'
        },
      ],
      implication: 'Your early team moves, trust-building patterns, and stakeholder relationships are not separate from performance - they are performance.'
    },
    {
      claim: 'Five common pitfalls derail new executives in the first 24 months',
      sources: [
        {
          id: 'spencer-pitfalls',
          type: 'business',
          title: '5 Pitfalls That Derail CEOs in the First 24 Months',
          publication: 'Spencer Stuart',
          url: 'https://www.spencerstuart.com/research-and-insight/five-pitfalls-that-derail-ceos-in-the-first-24-months',
          keyFinding: 'Common first-year pitfalls include moving too fast, misreading stakeholder positions, and underestimating internal complexity'
        },
      ],
      implication: 'Most executive failures are predictable. They follow recognizable patterns. Awareness + planning can prevent them.'
    },
  ],
}

/**
 * SECTION 5: BEHAVIOR CHANGE & IMPLEMENTATION
 * Why consistent action beats sporadic effort
 */
export const EVIDENCE_BEHAVIOR: EvidenceSection = {
  id: 'behavior-change',
  title: 'Behavior Change & Implementation',
  subtitle: 'Why intention is cheap and consistency is rare',
  overview: `
    The gap between intention and action is universal. Executives intend to build relationships, 
    follow up on opportunities, and prepare thoroughly. But most don't. The research on behavior 
    change shows why - and how to close that gap.
  `,
  whyItMatters: `
    A new executive role requires dozens of small, consistent actions: preparation before meetings, 
    follow-ups after conversations, relationship check-ins, continuous learning. Executives who excel 
    aren't necessarily smarter - they're better at converting intention into consistent action.
    
    The research shows how to do this: implementation plans, explicit goals, progress monitoring, 
    and accountability.
  `,
  keyInsights: [
    {
      claim: 'If-then implementation plans substantially increase goal enactment under uncertainty',
      sources: [
        {
          id: 'gollwitzer-1999',
          type: 'academic',
          authors: 'Gollwitzer, P.M.',
          title: 'Implementation intentions: Strong effects of simple plans',
          publication: 'American Psychologist',
          year: 1999,
          doi: 'https://doi.org/10.1037/0003-066X.54.7.493',
          keyFinding: 'If-then plans ("If I have coffee with the CEO, then I will ask X") dramatically increase the likelihood of intended behavior'
        },
        {
          id: 'gollwitzer-2006',
          type: 'academic',
          authors: 'Gollwitzer, P.M., & Sheeran, P.',
          title: 'Implementation intentions and goal achievement: A meta-analysis of effects and processes',
          publication: 'Advances in Experimental Social Psychology',
          year: 2006,
          doi: 'https://doi.org/10.1016/S0065-2601(06)38002-1',
          keyFinding: 'Implementation intentions produce reliable medium-to-large effects across diverse contexts; effect strengthens under stress and complexity'
        },
        {
          id: 'sm-implementation',
          type: 'internal',
          title: 'Concrete implementation plans outperform vague intent when behavior must happen under uncertainty',
          publication: 'Starting Monday method materials',
          url: '/method-and-evidence',
          keyFinding: 'When executives move from intention ("I should reach out") to implementation plan ("I will email X by Wednesday with Y message"), completion rates increase 2-3x'
        },
      ],
      implication: 'Micro-commitments and specific action triggers are not overkill - they\'re the difference between intention and outcome.'
    },
    {
      claim: 'Specific, difficult goals improve performance when commitment and feedback exist',
      sources: [
        {
          id: 'locke-2002',
          type: 'academic',
          authors: 'Locke, E.A., & Latham, G.P.',
          title: 'Building a practically useful theory of goal setting and task motivation: A 35-year odyssey',
          publication: 'American Psychologist',
          year: 2002,
          doi: 'https://doi.org/10.1037/0003-066X.57.9.705',
          keyFinding: 'Specific, moderately difficult goals with commitment and regular feedback produce 20-40% performance improvements'
        },
      ],
      implication: 'Vague goals ("Have good relationships") don\'t work. Specific goals with feedback ("Complete 3 relationship check-ins this week") do.'
    },
    {
      claim: 'Progress monitoring improves goal attainment; effects strengthen with public recording',
      sources: [
        {
          id: 'harkin-2016',
          type: 'academic',
          authors: 'Harkin, B., Webb, T.L., Chang, B.P.I., et al.',
          title: 'Does monitoring goal progress promote goal attainment? A meta-analysis of experimental evidence',
          publication: 'Psychological Bulletin',
          year: 2016,
          doi: 'https://doi.org/10.1037/bul0000025',
          keyFinding: 'Progress monitoring improves goal attainment; effects are largest when monitoring is frequent, visible, and shared'
        },
      ],
      implication: 'Weekly dashboards and visible progress tracking aren\'t administrative overhead - they\'re levers for better outcomes.'
    },
    {
      claim: 'Feedback effectiveness depends on framing and attention focus',
      sources: [
        {
          id: 'kluger-1996',
          type: 'academic',
          authors: 'Kluger, A.N., & DeNisi, A.',
          title: 'The effects of feedback interventions on performance: A historical review, a meta-analysis, and a preliminary feedback intervention theory',
          publication: 'Psychological Bulletin',
          year: 1996,
          doi: 'https://doi.org/10.1037/0033-2909.119.2.254',
          keyFinding: 'Feedback improves performance on average, but poorly designed feedback can hurt; framing and focus matter greatly'
        },
      ],
      implication: 'Not all feedback helps. Feedback that focuses on task vs. self, and that includes actionable next steps, works best.'
    },
  ],
}

/**
 * SECTION 6: ORGANIZATIONAL VISIBILITY & INFLUENCE
 * Why network position and strategic communication drive outcomes
 */
export const EVIDENCE_VISIBILITY: EvidenceSection = {
  id: 'organizational-visibility',
  title: 'Organizational Visibility & Influence',
  subtitle: 'Why network position shapes leadership effectiveness',
  overview: `
    Leadership effectiveness is not isolated. It's embedded in how an executive is positioned within 
    organizational networks, how they communicate strategic context, and how they navigate stakeholder 
    relationships.
  `,
  whyItMatters: `
    An executive who is technically strong but organizationally isolated will struggle. One who has 
    invested in strategic relationships, clear communication, and key stakeholder alignment will outperform. 
    This isn't politics - it's how organizations actually work.
  `,
  keyInsights: [
    {
      claim: 'Political skill is measurable and linked to leadership influence and team effectiveness',
      sources: [
        {
          id: 'ferris-2005',
          type: 'academic',
          authors: 'Ferris, G.R., Treadway, D.C., Kolodinsky, R.W., et al.',
          title: 'Development and validation of the Political Skill Inventory',
          publication: 'Journal of Management',
          year: 2005,
          doi: 'https://doi.org/10.1177/0149206304271386',
          keyFinding: 'Political skill is a measurable competency that predicts leadership influence, team performance, and stakeholder relationships'
        },
        {
          id: 'ahearn-2004',
          type: 'academic',
          authors: 'Ahearn, K.K., Ferris, G.R., Hochwarter, W.A., Douglas, C., & Ammeter, A.P.',
          title: 'Leader political skill and team performance',
          publication: 'Journal of Management',
          year: 2004,
          doi: 'https://doi.org/10.1016/j.jm.2003.01.004',
          keyFinding: 'Leader political skill predicts stronger team performance through improved stakeholder engagement and influence'
        },
      ],
      implication: 'Organizational navigation isn\'t optional. It\'s central to leadership effectiveness.'
    },
    {
      claim: 'Leadership effectiveness is embedded in network position and relationship quality',
      sources: [
        {
          id: 'balkundi-2006',
          type: 'academic',
          authors: 'Balkundi, P., & Kilduff, M.',
          title: 'The ties that lead: A social network approach to leadership',
          publication: 'The Leadership Quarterly',
          year: 2006,
          doi: 'https://doi.org/10.1016/j.leaqua.2006.01.001',
          keyFinding: 'Leadership effectiveness is embedded in network structure; central network positions predict influence and outcomes'
        },
      ],
      implication: 'Who you know and how you\'re positioned matters as much as what you know.'
    },
    {
      claim: 'Strategic communication quality links to organizational outcomes and stakeholder alignment',
      sources: [
        {
          id: 'men-2014a',
          type: 'academic',
          authors: 'Men, L.R.',
          title: 'Strategic internal communication: Transformational leadership, communication channels, and employee satisfaction',
          publication: 'Management Communication Quarterly',
          year: 2014,
          doi: 'https://doi.org/10.1177/0893318914524536',
          keyFinding: 'Strategic communication quality links to stronger organizational outcomes, employee engagement, and stakeholder trust'
        },
        {
          id: 'men-2014b',
          type: 'academic',
          authors: 'Men, L.R.',
          title: 'Why leadership matters to internal communication: Linking transformational leadership, symmetrical communication, and employee outcomes',
          publication: 'Journal of Public Relations Research',
          year: 2014,
          doi: 'https://doi.org/10.1080/1062726X.2014.908719',
          keyFinding: 'Leadership communication style influences trust and engagement outcomes; clarity and consistency matter more than frequency'
        },
      ],
      implication: 'How you communicate about the role, strategy, and organizational direction shapes how people perceive you and respond to your leadership.'
    },
  ],
}

/**
 * SECTION 7: INTERNAL PILOT DATA
 * Real outcomes from Starting Monday users
 */
export const EVIDENCE_INTERNAL: EvidenceSection = {
  id: 'internal-validation',
  title: 'Starting Monday Pilot Evidence',
  subtitle: 'Real outcomes from executives in transition',
  overview: `
    The frameworks above are grounded in published research. We've also tested them with real 
    executives in transition. Here's what we observed.
  `,
  whyItMatters: `
    Research shows what should work. Real-world evidence shows what actually does. The pilot data 
    below validates that the research translates to measurable outcomes.
  `,
  keyInsights: [
    {
      claim: 'Early-signal detection works; users detected transition movement weeks before public posting',
      sources: [
        {
          id: 'sm-pilot-3',
          type: 'internal',
          title: 'Early-signal detection validation',
          publication: 'Starting Monday blog',
          url: '/blog/how-we-estimate-early-role-signals',
          keyFinding: 'Role-shaping signals often surface 1-3 weeks before public posting based on our documented timing model; this window is where the highest-quality conversations happen'
        },
      ],
      implication: 'The research on signal timing predicts user outcomes; executives who move during the early-signal phase face better conversation quality and less competition.'
    },
  ],
}

/**
 * Full sections collection for navigation and rendering
 */
export const EVIDENCE_SECTIONS = [
  EVIDENCE_EARLY_SIGNALS,
  EVIDENCE_COACHING,
  EVIDENCE_ONBOARDING,
  EVIDENCE_BEHAVIOR,
  EVIDENCE_VISIBILITY,
  EVIDENCE_INTERNAL,
]

import { EVIDENCE_COACHING_TRANSITIONS } from './content-extra'

export { EVIDENCE_COACHING_TRANSITIONS, ALL_EVIDENCE_SOURCES } from './content-extra'

export const EVIDENCE_SECTIONS_WITH_COACHING_TRANSITIONS = [
  EVIDENCE_EARLY_SIGNALS,
  EVIDENCE_COACHING,
  EVIDENCE_COACHING_TRANSITIONS,
  EVIDENCE_ONBOARDING,
  EVIDENCE_BEHAVIOR,
  EVIDENCE_VISIBILITY,
]
