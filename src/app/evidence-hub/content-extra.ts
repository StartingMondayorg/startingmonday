import type { EvidenceSection, EvidenceSource } from './content'

/**
 * SECTION 7: COACHING FOR CAREER TRANSITIONS
 * Research on what coaches and job seekers need during executive search
 * Sources: docs/coach-transition-research-sources.md (compiled 2026-06-23)
 */
export const EVIDENCE_COACHING_TRANSITIONS: EvidenceSection = {
  id: 'coaching-transitions',
  title: 'Coaching for Career Transitions',
  subtitle: 'What the research says about what coaches and job seekers actually need',
  overview: `
    Career transition coaching lives or dies between sessions. The client needs execution infrastructure, not just strategic conversation. The coach needs to see what actually happened, not just hear a verbal status update.
  `,
  whyItMatters: `
    The research is clear: between-session tracking predicts outcomes more strongly than session quality alone. Implementation plans, structured accountability, and external visibility produce follow-through materially higher than intention alone. For executives in active search, that gap is measured in weeks.
  `,
  keyInsights: [
    {
      claim: 'Between-session homework and tracking are the strongest predictors of coaching outcome quality',
      sources: [
        {
          id: 'jones-2016-coaching',
          type: 'academic',
          authors: 'Jones, R.J., Woods, S.A., & Guillaume, Y.R.F.',
          title: 'The effectiveness of workplace coaching: A meta-analysis of learning and performance outcomes from coaching',
          publication: 'Journal of Occupational and Organizational Psychology',
          year: 2016,
          doi: 'https://doi.org/10.1111/joop.12119',
          keyFinding: 'Goal-setting and homework assignments were the most significant predictors of coaching outcome quality in 57-study meta-analysis. Effect on performance: d=0.55.'
        },
        {
          id: 'bozer-2018',
          type: 'academic',
          authors: 'Bozer, G. & Jones, R.J.',
          title: 'Understanding the factors that determine workplace coaching effectiveness: A systematic literature review',
          publication: 'European Journal of Work and Organizational Psychology',
          year: 2018,
          doi: 'https://doi.org/10.1080/1359432X.2018.1441152',
          keyFinding: 'Structured check-ins between sessions and explicit performance feedback are the most consistent moderators of coaching effectiveness across literature.'
        },
      ],
      implication: 'Coaches who have visibility into client execution between sessions - not just a verbal update - can give more precise feedback. That precision is what drives outcome improvement.'
    },
    {
      claim: 'Specific plans with if-then structure produce 3x higher follow-through than intentions alone',
      sources: [
        {
          id: 'gollwitzer-1999',
          type: 'academic',
          authors: 'Gollwitzer, P.M.',
          title: 'Implementation intentions: Strong effects of simple plans',
          publication: 'American Psychologist',
          year: 1999,
          doi: 'https://doi.org/10.1037/0003-066X.54.7.493',
          keyFinding: 'If-then implementation intentions ("When situation X occurs, I will do Y") dramatically increase follow-through - approximately 3x stronger than simple goal intention alone.'
        },
        {
          id: 'locke-latham-2002',
          type: 'academic',
          authors: 'Locke, E.A. & Latham, G.P.',
          title: 'Building a practically useful theory of goal setting and task motivation',
          publication: 'American Psychologist',
          year: 2002,
          doi: 'https://doi.org/10.1037/0003-066X.57.9.705',
          keyFinding: 'Specific, challenging goals with feedback loops produce significantly higher performance than "do your best" goals. Feedback is required - without it, goal effects decay.'
        },
      ],
      implication: 'Weekly prep briefs and commitment tracking are not administrative overhead. They are the mechanism by which intention becomes action. Removing them reduces campaign consistency.'
    },
    {
      claim: 'Weak ties - not closest contacts - produce the most executive job leads',
      sources: [
        {
          id: 'rajkumar-2022',
          type: 'academic',
          authors: 'Rajkumar, K., Saint-Jacques, G., Bojinov, I., Brynjolfsson, E., & Aral, S.',
          title: 'A causal test of the strength of weak ties',
          publication: 'Science',
          year: 2022,
          doi: 'https://doi.org/10.1126/science.abl4476',
          keyFinding: 'Randomized experiment on 20M+ LinkedIn users: moderately weak ties produced highest job mobility. Weakest ties by interaction intensity had greatest impact. Strong ties had least impact on job transmission.'
        },
        {
          id: 'granovetter-1973',
          type: 'academic',
          authors: 'Granovetter, M.S.',
          title: 'The strength of weak ties',
          publication: 'American Journal of Sociology',
          year: 1973,
          doi: 'https://doi.org/10.1086/225469',
          keyFinding: 'Weak social ties carry non-redundant information from different social clusters, making them more effective for job information transmission than close-network connections.'
        },
      ],
      implication: 'Coaching clients who only activate inner-circle contacts are working the least productive part of their network. Signal monitoring and structured outreach to moderate ties systematically outperforms intensive inner-circle work.'
    },
    {
      claim: 'Strategic network quality - not functional depth - predicts senior transition success',
      sources: [
        {
          id: 'ibarra-hunter-2007',
          type: 'business',
          authors: 'Ibarra, H. & Hunter, M.L.',
          title: 'How leaders create and use networks',
          publication: 'Harvard Business Review',
          year: 2007,
          url: 'https://hbr.org/2007/01/how-leaders-create-and-use-networks',
          keyFinding: 'Senior leaders need three network types: personal (mentors), operational (current role), and strategic (next role). Strategic network quality is the differentiator during leadership transitions - and the most underdeveloped.'
        },
      ],
      implication: 'Most executives are overinvested in operational networks and underinvested in strategic ones. The coaching value here is helping clients consciously build the strategic tier before a search begins.'
    },
    {
      claim: 'ICF data: career coaching is a top-3 coaching niche; clients increasingly expect credentials',
      sources: [
        {
          id: 'icf-2023',
          type: 'business',
          authors: 'International Coaching Federation / PricewaterhouseCoopers',
          title: 'Global Coaching Study Executive Summary 2023',
          publication: 'International Coaching Federation',
          year: 2023,
          url: 'https://coachingfederation.org/research/global-coaching-study',
          keyFinding: 'Based on 14,591 coaches globally. Career-related coaching is in top 3 coaching niches. 73% of clients expect a coaching credential. Global industry revenue reached $4.56B in 2022, up 60% since 2019.'
        },
        {
          id: 'icf-2025',
          type: 'business',
          authors: 'International Coaching Federation / PricewaterhouseCoopers',
          title: 'Global Coaching Study 2025 Key Findings',
          publication: 'International Coaching Federation',
          year: 2025,
          url: 'https://coachingfederation.org/research/global-coaching-study',
          keyFinding: '122,974 active coaches globally (record). Revenue estimated at $5.34B. 60% of coaches now offer training; 57% offer consulting. Most expect growth through client volume, signaling demand for coach delivery infrastructure.'
        },
      ],
      implication: 'The market for executive career coaching is large and growing. Clients are increasingly credentialed-expectant and result-oriented. Coaches who can demonstrate outcomes - not just process - will grow faster.'
    },
    {
      claim: 'Pre-launch visibility in executive search produces 2.5x shortlist rate vs. post-launch response',
      sources: [
        {
          id: 'spencer-stuart-2023',
          type: 'business',
          authors: 'Spencer Stuart',
          title: 'Board Monitor US: What Boards Look For in Executive Candidates',
          publication: 'Spencer Stuart',
          year: 2023,
          url: 'https://www.spencerstuart.com/research-and-insight/us-board-monitor',
          keyFinding: 'Most C-suite appointments are made through relationship referrals before public posting. Candidates visible in targeted networks before a search launches appear on shortlists at 2.5x the rate of those who respond after posting.'
        },
        {
          id: 'heidrick-2022',
          type: 'business',
          authors: 'Heidrick & Struggles',
          title: 'Route to the Top: A Longitudinal Study of Chief Executive Officers',
          publication: 'Heidrick & Struggles',
          year: 2022,
          url: 'https://www.heidrick.com/en/insights/ceo-succession/route-to-the-top',
          keyFinding: '73% of new CEO appointments come from internal succession or known external candidates. External winners had built sustained relationships with board members and search advisors well before any formal opening.'
        },
      ],
      implication: 'Coaching clients who wait for a job posting to launch outreach are entering a search that is already 6-12 months old. The entire pre-launch window is where coaching infrastructure - signal monitoring, relationship activation - produces compounding returns.'
    },
  ],
}


/**
 * All sources for reference and citations
 */
export const ALL_EVIDENCE_SOURCES: EvidenceSource[] = [
  // Academic: Signals & Market Timing
  {
    id: 'spence-1973',
    type: 'academic',
    authors: 'Spence, M.',
    title: 'Job market signaling',
    publication: 'The Quarterly Journal of Economics',
    year: 1973,
    doi: 'https://doi.org/10.2307/1882010',
    keyFinding: 'Signals reduce information asymmetry in hiring markets'
  },
  {
    id: 'akerlof-1970',
    type: 'academic',
    authors: 'Akerlof, G.A.',
    title: 'The market for "lemons": Quality uncertainty and the market mechanism',
    publication: 'The Quarterly Journal of Economics',
    year: 1970,
    doi: 'https://doi.org/10.2307/1879431',
    keyFinding: 'Asymmetric information distorts market outcomes'
  },
  // Academic: CEO Turnover
  {
    id: 'warner-1988',
    type: 'academic',
    authors: 'Warner, J.B., Watts, R.L., & Wruck, K.H.',
    title: 'Stock prices and top management changes',
    publication: 'Journal of Financial Economics',
    year: 1988,
    doi: 'https://doi.org/10.1016/0304-405X(88)90054-2',
    keyFinding: 'Equity markets react around management change events'
  },
  {
    id: 'parrino-1997',
    type: 'academic',
    authors: 'Parrino, R.',
    title: 'CEO turnover and outside succession: A cross-sectional analysis',
    publication: 'Journal of Financial Economics',
    year: 1997,
    doi: 'https://doi.org/10.1016/S0304-405X(97)00028-7',
    keyFinding: 'Poor firm performance predicts turnover'
  },
  {
    id: 'huson-2001',
    type: 'academic',
    authors: 'Huson, M.R., Parrino, R., & Starks, L.T.',
    title: 'Internal monitoring mechanisms and CEO turnover: A long-term perspective',
    publication: 'The Journal of Finance',
    year: 2001,
    doi: 'https://doi.org/10.1111/0022-1082.00405',
    keyFinding: 'Governance structures shape turnover probability'
  },
  {
    id: 'jenter-2015',
    type: 'academic',
    authors: 'Jenter, D., & Kanaan, F.',
    title: 'CEO turnover and relative performance evaluation',
    publication: 'The Journal of Finance',
    year: 2015,
    doi: 'https://doi.org/10.1111/jofi.12282',
    keyFinding: 'Boards respond to relative performance'
  },
  // Academic: Coaching
  {
    id: 'theeboom-2014',
    type: 'academic',
    authors: 'Theeboom, T., Beersma, B., & van Vianen, A.E.M.',
    title: 'Does coaching work? A meta-analysis on the effects of coaching on individual-level outcomes in an organizational context',
    publication: 'The Journal of Positive Psychology',
    year: 2014,
    doi: 'https://doi.org/10.1080/17439760.2013.837499',
    keyFinding: 'Coaching shows positive effects across performance outcomes'
  },
  {
    id: 'jones-2016',
    type: 'academic',
    authors: 'Jones, R.J., Woods, S.A., & Guillaume, Y.R.F.',
    title: 'The effectiveness of workplace coaching: A meta-analysis of learning and performance outcomes from coaching',
    publication: 'Journal of Occupational and Organizational Psychology',
    year: 2016,
    doi: 'https://doi.org/10.1111/joop.12119',
    keyFinding: 'Coaching improves work performance'
  },
  {
    id: 'dehaan-2013',
    type: 'academic',
    authors: 'de Haan, E., Duckworth, A., Birch, D., & Jones, C.',
    title: 'Executive coaching outcome research: The contribution of common factors such as relationship, personality match, and self-efficacy',
    publication: 'Consulting Psychology Journal: Practice and Research',
    year: 2013,
    doi: 'https://doi.org/10.1037/a0031635',
    keyFinding: 'Coaching relationship quality drives outcomes'
  },
  {
    id: 'smither-2003',
    type: 'academic',
    authors: 'Smither, J.W., London, M., Flautt, R., Vargas, Y., & Kucine, I.',
    title: 'Can working with an executive coach improve multisource feedback ratings over time? A quasi-experimental field study',
    publication: 'Personnel Psychology',
    year: 2003,
    doi: 'https://doi.org/10.1111/j.1744-6570.2003.tb00142.x',
    keyFinding: 'Coaching linked to sustained feedback improvements'
  },
  // Academic: Onboarding
  {
    id: 'bauer-2007',
    type: 'academic',
    authors: 'Bauer, T.N., Bodner, T., Erdogan, B., Truxillo, D.M., & Tucker, J.S.',
    title: 'Newcomer adjustment during organizational socialization: A meta-analytic review of antecedents, outcomes, and methods',
    publication: 'Journal of Applied Psychology',
    year: 2007,
    doi: 'https://doi.org/10.1037/0021-9010.92.3.707',
    keyFinding: 'Role clarity and social acceptance predict adjustment'
  },
  {
    id: 'saks-2012',
    type: 'academic',
    authors: 'Saks, A.M., & Gruman, J.A.',
    title: 'Getting Newcomers On Board: A Review of Socialization Practices and Introduction to Socialization Resources Theory',
    publication: 'The Oxford Handbook of Organizational Socialization',
    year: 2012,
    doi: 'https://doi.org/10.1093/oxfordhb/9780199763672.013.0003',
    keyFinding: 'Structured onboarding improves outcomes'
  },
  {
    id: 'shen-2002',
    type: 'academic',
    authors: 'Shen, W., & Cannella, A.A.',
    title: 'Revisiting the performance consequences of CEO succession',
    publication: 'Academy of Management Journal',
    year: 2002,
    doi: 'https://doi.org/10.2307/3069306',
    keyFinding: 'Successor type shapes post-succession performance'
  },
  // Academic: Behavior Change
  {
    id: 'gollwitzer-1999',
    type: 'academic',
    authors: 'Gollwitzer, P.M.',
    title: 'Implementation intentions: Strong effects of simple plans',
    publication: 'American Psychologist',
    year: 1999,
    doi: 'https://doi.org/10.1037/0003-066X.54.7.493',
    keyFinding: 'If-then plans increase goal enactment'
  },
  {
    id: 'gollwitzer-2006',
    type: 'academic',
    authors: 'Gollwitzer, P.M., & Sheeran, P.',
    title: 'Implementation intentions and goal achievement: A meta-analysis of effects and processes',
    publication: 'Advances in Experimental Social Psychology',
    year: 2006,
    doi: 'https://doi.org/10.1016/S0065-2601(06)38002-1',
    keyFinding: 'Implementation intentions produce reliable effects'
  },
  {
    id: 'locke-2002',
    type: 'academic',
    authors: 'Locke, E.A., & Latham, G.P.',
    title: 'Building a practically useful theory of goal setting and task motivation: A 35-year odyssey',
    publication: 'American Psychologist',
    year: 2002,
    doi: 'https://doi.org/10.1037/0003-066X.57.9.705',
    keyFinding: 'Specific goals with feedback improve performance'
  },
  {
    id: 'harkin-2016',
    type: 'academic',
    authors: 'Harkin, B., Webb, T.L., Chang, B.P.I., et al.',
    title: 'Does monitoring goal progress promote goal attainment? A meta-analysis of experimental evidence',
    publication: 'Psychological Bulletin',
    year: 2016,
    doi: 'https://doi.org/10.1037/bul0000025',
    keyFinding: 'Progress monitoring improves goal attainment'
  },
  {
    id: 'kluger-1996',
    type: 'academic',
    authors: 'Kluger, A.N., & DeNisi, A.',
    title: 'The effects of feedback interventions on performance: A historical review, a meta-analysis, and a preliminary feedback intervention theory',
    publication: 'Psychological Bulletin',
    year: 1996,
    doi: 'https://doi.org/10.1037/0033-2909.119.2.254',
    keyFinding: 'Feedback effectiveness depends on framing'
  },
  // Academic: Visibility & Network
  {
    id: 'ferris-2005',
    type: 'academic',
    authors: 'Ferris, G.R., Treadway, D.C., Kolodinsky, R.W., et al.',
    title: 'Development and validation of the Political Skill Inventory',
    publication: 'Journal of Management',
    year: 2005,
    doi: 'https://doi.org/10.1177/0149206304271386',
    keyFinding: 'Political skill predicts leadership influence'
  },
  {
    id: 'ahearn-2004',
    type: 'academic',
    authors: 'Ahearn, K.K., Ferris, G.R., Hochwarter, W.A., Douglas, C., & Ammeter, A.P.',
    title: 'Leader political skill and team performance',
    publication: 'Journal of Management',
    year: 2004,
    doi: 'https://doi.org/10.1016/j.jm.2003.01.004',
    keyFinding: 'Leader political skill predicts team performance'
  },
  {
    id: 'balkundi-2006',
    type: 'academic',
    authors: 'Balkundi, P., & Kilduff, M.',
    title: 'The ties that lead: A social network approach to leadership',
    publication: 'The Leadership Quarterly',
    year: 2006,
    doi: 'https://doi.org/10.1016/j.leaqua.2006.01.001',
    keyFinding: 'Network position predicts leadership effectiveness'
  },
  {
    id: 'men-2014a',
    type: 'academic',
    authors: 'Men, L.R.',
    title: 'Strategic internal communication: Transformational leadership, communication channels, and employee satisfaction',
    publication: 'Management Communication Quarterly',
    year: 2014,
    doi: 'https://doi.org/10.1177/0893318914524536',
    keyFinding: 'Strategic communication links to organizational outcomes'
  },
  {
    id: 'men-2014b',
    type: 'academic',
    authors: 'Men, L.R.',
    title: 'Why leadership matters to internal communication: Linking transformational leadership, symmetrical communication, and employee outcomes',
    publication: 'Journal of Public Relations Research',
    year: 2014,
    doi: 'https://doi.org/10.1080/1062726X.2014.908719',
    keyFinding: 'Leadership communication style influences outcomes'
  },
]







