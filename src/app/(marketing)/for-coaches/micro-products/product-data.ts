export type CoachMicroProductDeliverable = {
  title: string
  exampleLabel: string
  previewTitle: string
  previewLines: string[]
}

export type CoachMicroProduct = {
  slug: string
  name: string
  price: string
  oneLiner: string
  whoItsFor: string
  pain: string
  promise: string
  deliverables: CoachMicroProductDeliverable[]
  appBridge: {
    eyebrow: string
    headline: string
    body: string
    cta: string
    ctaHref: string
  }
  checkoutCopy: {
    headline: string
    bullets: string[]
    guarantee: string
  }
}

export const COACH_MICRO_PRODUCTS: CoachMicroProduct[] = [
  {
    slug: 'coach-session-anti-drift-kit',
    name: 'Coach Session Anti-Drift Kit',
    price: '$79 one-time',
    oneLiner: 'The operator-grade kit that cuts context rebuild and protects strategic coaching time.',
    whoItsFor: 'Executive coaches running active VP-to-CXO and board-track transitions.',
    pain:
      'Sessions are expensive, but too much time is lost rebuilding context and chasing follow-through between meetings.',
    promise:
      'Reduce context rebuild, improve weekly follow-through, and increase session quality in 14 days.',
    deliverables: [
      {
        title: 'Pre-session diagnostic worksheet (5-minute prep)',
        exampleLabel: 'Worksheet preview',
        previewTitle: 'Client prep snapshot',
        previewLines: ['Priority role: COO search', 'This week\'s drag: low outreach volume', 'Coach focus: tighten proof stories'],
      },
      {
        title: 'Live session structure template (45-60 min)',
        exampleLabel: 'Agenda preview',
        previewTitle: 'Session flow',
        previewLines: ['5 min: reset target role', '20 min: pressure-test examples', '10 min: assign one concrete next move'],
      },
      {
        title: 'Session-close accountability script (owner + date + signal)',
        exampleLabel: 'Script preview',
        previewTitle: 'Close with commitment',
        previewLines: ['Owner: client', 'By Friday: send 3 targeted follow-ups', 'Signal: screenshots shared before next call'],
      },
      {
        title: 'Monday-through-Friday momentum tracker',
        exampleLabel: 'Tracker preview',
        previewTitle: 'Weekly momentum board',
        previewLines: ['Mon: target list refreshed', 'Wed: 2 conversations booked', 'Fri: evidence gaps flagged for next session'],
      },
      {
        title: 'Coach debrief template with intervention triggers',
        exampleLabel: 'Debrief preview',
        previewTitle: 'Post-session notes',
        previewLines: ['Pattern: over-explaining outcomes', 'Trigger: no new outreach by Thursday', 'Intervention: shorten narrative and rehearse ask'],
      },
    ],
    appBridge: {
      eyebrow: 'When this becomes a workflow problem',
      headline: 'This kit fixes one session. Starting Monday keeps the next ten sessions aligned.',
      body:
        'Use the kit to tighten one coaching cycle fast. Use Starting Monday when you want that prep, follow-through, and signal tracking to live across every active client instead of one worksheet at a time.',
      cta: 'Use the kit for the session. Use Starting Monday for the ongoing operating rhythm.',
      ctaHref: '/for-coaches',
    },
    checkoutCopy: {
      headline: 'Buy once. Use in every client cycle.',
      bullets: [
        'Instant delivery after checkout',
        'Editable templates in practical coaching format',
        'Built to reduce recap fatigue and execution drift',
      ],
      guarantee:
        'If you do not see clearer between-session accountability in 14 days, request a refund. No friction.',
    },
  },
  {
    slug: 'shadow-search-governance-pack',
    name: 'Shadow Search Governance Pack',
    price: '$99 one-time',
    oneLiner: 'The confidentiality and governance communication pack for coaches in sensitive transition dynamics.',
    whoItsFor: 'Executive coaches supporting board-sensitive or confidential leadership transitions.',
    pain:
      'Governance ambiguity creates trust risk, delayed decisions, and communication breakdowns that hurt both client and company.',
    promise:
      'Create cleaner governance communication boundaries and reduce avoidable trust risk before escalation.',
    deliverables: [
      {
        title: 'Governance communication checklist',
        exampleLabel: 'Checklist preview',
        previewTitle: 'Before the conversation',
        previewLines: ['Who needs to know now', 'What stays verbal, not written', 'Which decisions require board visibility'],
      },
      {
        title: 'Risk memo template for sensitive transition moments',
        exampleLabel: 'Memo preview',
        previewTitle: 'Situation summary',
        previewLines: ['Context: leadership transition becoming visible', 'Risk: mixed messages across advisors', 'Need: one owner for next-step communication'],
      },
      {
        title: 'Board-facing clarification prompts',
        exampleLabel: 'Prompt sheet preview',
        previewTitle: 'Clarify expectations',
        previewLines: ['What decision is actually pending', 'What confidentiality boundary applies', 'What timing risk matters most'],
      },
      {
        title: 'Coach scripts for difficult but necessary conversations',
        exampleLabel: 'Script preview',
        previewTitle: 'Language for tough moments',
        previewLines: ['We need a cleaner owner here', 'That update should not travel beyond this group yet', 'Let\'s separate advice from decision rights'],
      },
      {
        title: 'Escalation threshold framework',
        exampleLabel: 'Threshold preview',
        previewTitle: 'When to escalate',
        previewLines: ['Escalate if sponsor messages conflict', 'Escalate if confidentiality is already breached', 'Escalate if timing creates governance exposure'],
      },
    ],
    appBridge: {
      eyebrow: 'When this turns into a standing issue',
      headline: 'This pack helps with one sensitive moment. Starting Monday helps you manage the whole transition.',
      body:
        'Use the pack to handle board-sensitive communication cleanly. Use Starting Monday when you want the underlying signals, prep, and follow-up tracked across the transition so nothing important gets lost between conversations.',
      cta: 'Use the pack for the conversation. Use Starting Monday for the transition system around it.',
      ctaHref: '/for-coaches',
    },
    checkoutCopy: {
      headline: 'Practical governance templates, not theory slides.',
      bullets: [
        'Confidentiality-aware language patterns included',
        'Designed for real board and advisor interactions',
        'Can be deployed the same day as purchase',
      ],
      guarantee:
        'If this pack does not materially improve clarity in a live governance discussion, request a refund.',
    },
  },
  {
    slug: 'executive-positioning-narrative-builder',
    name: 'Executive Positioning Narrative Builder',
    price: '$59 one-time',
    oneLiner: 'Fix the vague executive story that keeps costing your client credibility in high-stakes conversations.',
    whoItsFor: 'Executive coaches helping clients tighten their market story and interview positioning.',
    pain:
      'Your client may be experienced, but if they sound broad, hesitant, or forgettable, the market reads them as less ready than they are. That turns good coaching time into repeated narrative rescue work.',
    promise: 'Use one session to turn fuzzy positioning into a sharper executive story you can reuse in interviews, networking, and sponsor conversations.',
    deliverables: [
      {
        title: 'Executive positioning worksheet',
        exampleLabel: 'Worksheet preview',
        previewTitle: 'Story anchors',
        previewLines: ['Current role: enterprise operations leader', 'Target move: COO or president track', 'Signature proof: scaled complex change across teams'],
      },
      {
        title: 'Proof-point sorting template',
        exampleLabel: 'Sorting preview',
        previewTitle: 'Keep / cut / sharpen',
        previewLines: ['Keep: quantified business outcome', 'Cut: generic leadership language', 'Sharpen: one example that proves scale'],
      },
      {
        title: 'Story tightening prompts for live sessions',
        exampleLabel: 'Prompt preview',
        previewTitle: 'Coach questions',
        previewLines: ['What would make this answer sound more decisive?', 'Which example proves this at executive level?', 'What is the shortest version that still feels credible?'],
      },
      {
        title: 'Client-facing narrative draft format',
        exampleLabel: 'Draft preview',
        previewTitle: 'Executive summary',
        previewLines: ['I lead cross-functional change in complex environments.', 'I am moving toward a broader operating role.', 'My value is turning ambiguity into execution.'],
      },
    ],
    appBridge: {
      eyebrow: 'When the story has to hold up every week',
      headline: 'This kit fixes the story now. Starting Monday keeps that story connected to real search activity.',
      body:
        'Use this kit when the immediate pain is weak positioning. Move into Starting Monday when you want that sharper story tied to live signals, prep briefs, and recurring between-session execution across the full search.',
      cta: 'See how Starting Monday keeps positioning, prep, and momentum aligned',
      ctaHref: '/for-coaches',
    },
    checkoutCopy: {
      headline: 'A concise narrative tool for the next important conversation.',
      bullets: [
        'Helps tighten one executive story fast',
        'Useful before networking, interviews, or sponsor conversations',
        'Creates a reusable narrative foundation',
      ],
      guarantee:
        'If this kit does not leave you with a clearer executive story after one use, request a refund.',
    },
  },
  {
    slug: 'first-30-days-transition-conversation-pack',
    name: 'First 30 Days Transition Conversation Pack',
    price: '$79 one-time',
    oneLiner: 'Reduce first-month confusion before a role change turns into coaching cleanup.',
    whoItsFor: 'Executive coaches guiding clients through a new role, board shift, or leadership transition.',
    pain:
      'The first 30 days are where smart clients start guessing, stakeholders send mixed signals, and you spend expensive coaching time untangling preventable confusion.',
    promise: 'Create a clearer first-month plan so your client starts the transition with better conversations, cleaner expectations, and fewer avoidable surprises.',
    deliverables: [
      {
        title: 'First-30-days planning worksheet',
        exampleLabel: 'Plan preview',
        previewTitle: 'Month-one map',
        previewLines: ['Week 1: clarify success criteria', 'Week 2: identify stakeholder risks', 'Week 3: tighten communication cadence'],
      },
      {
        title: 'Stakeholder conversation map',
        exampleLabel: 'Stakeholder preview',
        previewTitle: 'Who needs what',
        previewLines: ['Sponsor: confidence and timing', 'Peers: clarity on decisions', 'Team: steady operating rhythm'],
      },
      {
        title: 'Weekly reflection prompts',
        exampleLabel: 'Reflection preview',
        previewTitle: 'Check-in questions',
        previewLines: ['What surprised you this week?', 'Where did assumptions break down?', 'What needs to be clearer before next week?'],
      },
      {
        title: 'Transition-risk discussion script',
        exampleLabel: 'Script preview',
        previewTitle: 'Coach language',
        previewLines: ['What is still uncertain?', 'Which expectation is most likely to drift?', 'What needs one cleaner owner?'],
      },
    ],
    appBridge: {
      eyebrow: 'When the transition needs a real operating rhythm',
      headline: 'This pack gets month one under control. Starting Monday keeps the transition visible after the plan is written.',
      body:
        'Use this pack when the immediate pain is first-month uncertainty. Move into Starting Monday when you want signals, prep, and follow-through tracked in one place as the role change unfolds week by week.',
      cta: 'See how Starting Monday supports the full transition after month one',
      ctaHref: '/for-coaches',
    },
    checkoutCopy: {
      headline: 'One pack for the month that matters most.',
      bullets: [
        'Focused on the fragile first 30 days',
        'Helps reduce confusion and reactive cleanup',
        'Designed for live coaching conversations',
      ],
      guarantee:
        'If this pack does not make the first month easier to coach, request a refund.',
    },
  },
  {
    slug: 'executive-proof-library-builder',
    name: 'Executive Proof Library Builder',
    price: '$69 one-time',
    oneLiner: 'Stop losing good stories because the proof is scattered when your client needs it most.',
    whoItsFor: 'Coaches helping clients prepare for interviews, networking, and high-stakes stakeholder conversations.',
    pain:
      'Your client may have real wins, but if the proof lives in memory, old decks, and half-remembered anecdotes, every prep session starts from scratch and the strongest evidence never shows up on demand.',
    promise: 'Turn scattered wins into a reusable proof library so prep gets faster and answers land with more authority.',
    deliverables: [
      {
        title: 'Win-capture worksheet',
        exampleLabel: 'Capture preview',
        previewTitle: 'Recent wins',
        previewLines: ['Led turnaround initiative', 'Reduced operating delay by 18%', 'Built new cross-functional cadence'],
      },
      {
        title: 'Metrics extraction prompts',
        exampleLabel: 'Metrics preview',
        previewTitle: 'Quantify the story',
        previewLines: ['What changed in the business?', 'What size or scale proves it?', 'What number should appear in the story?'],
      },
      {
        title: 'Leadership story template',
        exampleLabel: 'Story preview',
        previewTitle: 'One executive example',
        previewLines: ['Situation: complexity was rising', 'Action: I aligned teams around a single goal', 'Result: the work moved faster and cleaner'],
      },
      {
        title: 'Proof library organizer',
        exampleLabel: 'Library preview',
        previewTitle: 'Example bank',
        previewLines: ['Scale wins', 'Turnaround wins', 'People leadership wins'],
      },
    ],
    appBridge: {
      eyebrow: 'When proof needs to show up on time',
      headline: 'This builder organizes the proof now. Starting Monday keeps it usable inside live prep and active opportunities.',
      body:
        'Use this builder when the immediate pain is scattered evidence. Move into Starting Monday when you want those examples connected to live signals, prep briefs, and recurring search activity instead of living in a static file.',
      cta: 'See how Starting Monday turns proof into a live coaching asset',
      ctaHref: '/for-coaches',
    },
    checkoutCopy: {
      headline: 'A simple way to stop rebuilding examples from scratch.',
      bullets: [
        'Helps capture proof faster',
        'Makes interview and networking prep easier',
        'Works as a reusable coaching asset',
      ],
      guarantee:
        'If this builder does not leave you with a clearer proof library, request a refund.',
    },
  },
  {
    slug: 'board-stakeholder-update-writing-kit',
    name: 'Board and Stakeholder Update Writing Kit',
    price: '$89 one-time',
    oneLiner: 'Write the sensitive update cleanly before messy messaging creates trust risk.',
    whoItsFor: 'Executive coaches helping clients write sensitive updates for boards, sponsors, and key stakeholders.',
    pain:
      'When the stakes rise, updates often become vague, defensive, or overloaded. One bad message can create confusion, trust risk, and another round of coaching repair work.',
    promise: 'Write clearer updates that say what matters, avoid avoidable risk, and leave the reader with more confidence than confusion.',
    deliverables: [
      {
        title: 'Update memo template',
        exampleLabel: 'Memo preview',
        previewTitle: 'Short update frame',
        previewLines: ['What changed', 'Why it matters', 'What decision is needed next'],
      },
      {
        title: 'Stakeholder message framing guide',
        exampleLabel: 'Framing preview',
        previewTitle: 'Who gets what',
        previewLines: ['Board: decision context', 'Sponsor: progress and risk', 'Team: operating clarity'],
      },
      {
        title: 'Tone guard checklist',
        exampleLabel: 'Tone preview',
        previewTitle: 'Before sending',
        previewLines: ['Is this too vague?', 'Is this too defensive?', 'Does this say only what needs saying?'],
      },
      {
        title: 'Revision prompts for sensitive drafts',
        exampleLabel: 'Revision preview',
        previewTitle: 'Clean the message',
        previewLines: ['Shorten this sentence', 'Make the owner clearer', 'Remove language that creates ambiguity'],
      },
    ],
    appBridge: {
      eyebrow: 'When the message depends on ongoing execution',
      headline: 'This kit sharpens one update. Starting Monday helps the work behind that update stay visible over time.',
      body:
        'Use this kit when the immediate pain is one high-risk message. Move into Starting Monday when you want the prep, signals, and follow-through behind that message organized across the whole coaching cycle.',
      cta: 'See how Starting Monday supports the workflow behind the update',
      ctaHref: '/for-coaches',
    },
    checkoutCopy: {
      headline: 'A practical writing kit for moments that carry real risk.',
      bullets: [
        'Helps create sharper stakeholder updates',
        'Useful for boards, sponsors, and sensitive transitions',
        'Designed to reduce message risk quickly',
      ],
      guarantee:
        'If this kit does not make one real update easier to write, request a refund.',
    },
  },
  {
    slug: 'interview-debrief-recovery-pack',
    name: 'Interview Debrief and Recovery Pack',
    price: '$49 one-time',
    oneLiner: 'Recover faster after a bad interview before one rough conversation turns into momentum loss.',
    whoItsFor: 'Executive coaches helping clients recover after interviews, missed opportunities, or stalled conversations.',
    pain:
      'After a tough interview, clients often spiral, overreact, and lose confidence. Coaches then spend valuable time sorting signal from emotion instead of building the next move.',
    promise: 'Turn one messy interview outcome into a cleaner debrief, a stronger reset, and a better next conversation.',
    deliverables: [
      {
        title: 'Interview debrief template',
        exampleLabel: 'Debrief preview',
        previewTitle: 'What happened?',
        previewLines: ['What went well', 'Where the answer drifted', 'What should change next time'],
      },
      {
        title: 'Missed-signal review page',
        exampleLabel: 'Signal review preview',
        previewTitle: 'Lost opportunities',
        previewLines: ['Too broad on outcomes', 'Too little evidence', 'Weak closing question'],
      },
      {
        title: 'Recovery conversation script',
        exampleLabel: 'Recovery preview',
        previewTitle: 'Coach language',
        previewLines: ['Let\'s isolate the signal from the emotion', 'What would make the next answer stronger?', 'Which detail should we rehearse?'],
      },
      {
        title: 'Next-interview reset worksheet',
        exampleLabel: 'Reset preview',
        previewTitle: 'Next-step plan',
        previewLines: ['One cleaner story', 'One stronger example', 'One better closing move'],
      },
    ],
    appBridge: {
      eyebrow: 'When one setback starts repeating',
      headline: 'This pack helps you recover from one interview. Starting Monday helps you see the pattern across the whole search.',
      body:
        'Use this pack when the immediate pain is one bad interview cycle. Move into Starting Monday when you want recurring prep, signals, and follow-through to stay visible across every client and every next step.',
      cta: 'See how Starting Monday prevents one setback from becoming a pattern',
      ctaHref: '/for-coaches',
    },
    checkoutCopy: {
      headline: 'A quick reset for one bad interview or stalled opportunity.',
      bullets: [
        'Helps coaches debrief faster',
        'Turns disappointment into a next move',
        'Useful immediately after an interview cycle',
      ],
      guarantee:
        'If this pack does not make the next interview conversation clearer, request a refund.',
    },
  },
]

export function getCoachMicroProduct(slug: string): CoachMicroProduct | undefined {
  return COACH_MICRO_PRODUCTS.find((product) => product.slug === slug)
}
