'use client'

import { useMemo, useState } from 'react'

type BriefInput = {
  clientName: string
  companyDescription: string
  mandateRole: string
  triggerEvent: string
  boardContext: string
  boardConcerns: string
  timeline: string
  mustHaves: string
  compensationBand: string
  candidateName: string
  candidateSummary: string
}

const sampleBrief = {
  candidateName: 'Jordan Patel',
  mandateRole: 'Chief Financial Officer',
  clientName: 'Apex Field Systems',
  companyDescription:
    'PE-backed field services software company at $180M ARR. Expanding from North America into EMEA after a recent tuck-in acquisition.',
  triggerEvent:
    'New sponsor-led growth plan after acquisition of two regional competitors. Finance team must integrate systems and prepare for potential exit in 24-36 months.',
  boardContext:
    'Board expects disciplined integration, faster reporting cadence, and stronger investor narrative for secondary sale readiness.',
  timeline: 'Target shortlist in 4 weeks; hire in 10 weeks.',
  mustHaves:
    'Led at least one post-acquisition integration, built FP&A at scale, operated with active PE board, and managed international finance expansion.',
  compensationBand: '$220K base + 40% bonus + equity refresh tied to exit event.',
  candidateSummary:
    'Former finance leader at two growth SaaS companies. Scaled team from 6 to 28, integrated one $120M acquisition, and reduced monthly close from 12 days to 5.',
  boardQuestions: [
    'How will you preserve operating discipline while integrating two acquired businesses and preparing the company for exit?',
    'What reporting cadence would you put in place for the board in the first 90 days?',
    'Where will you personally spend time versus delegate as the finance platform scales internationally?',
  ],
  objections: [
    {
      label: 'Scope fit',
      body: 'The board may worry the candidate is too SaaS-centric. Answer: they have already led finance through acquisition integration, international expansion, and sponsor-facing reporting.',
    },
    {
      label: 'Scale readiness',
      body: 'The team may question whether the candidate has handled the pace of a PE-backed environment. Answer: they scaled a finance function from 6 to 28 and cut close cycles materially.',
    },
    {
      label: 'Board communication',
      body: 'The board will want crisp, low-drama communication. Answer: use the candidate\'s history of disciplined reporting and clear ownership of operating metrics.',
    },
  ],
}

const defaultInput: BriefInput = {
  clientName: '',
  companyDescription: '',
  mandateRole: 'Chief Financial Officer',
  triggerEvent: '',
  boardContext: '',
  boardConcerns: '',
  timeline: '',
  mustHaves: '',
  compensationBand: '',
  candidateName: '',
  candidateSummary: '',
}

function toBulletList(value: string): string[] {
  return value
    .split(/\n|,|;/)
    .map((v) => v.trim())
    .filter(Boolean)
}

function renderSection(title: string, body: string | string[]) {
  if (Array.isArray(body)) {
    return (
      <div className="rounded-lg border border-border p-5">
        <h4 className="text-sm font-bold tracking-[0.08em] uppercase text-muted-foreground">{title}</h4>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {body.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="font-bold text-primary">+</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border p-5">
      <h4 className="text-sm font-bold tracking-[0.08em] uppercase text-muted-foreground">{title}</h4>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  )
}

export default function SearchFirmSampleBriefExperience() {
  const [input, setInput] = useState<BriefInput>(defaultInput)
  const [showGenerated, setShowGenerated] = useState(false)

  const generated = useMemo(() => {
    const role = input.mandateRole || 'Executive Mandate'
    const client = input.clientName || 'Client Company'
    const candidate = input.candidateName || 'Candidate Name'

    return {
      title: `${role} Brief for ${client}`,
      candidateHeadline: `${candidate} - Preliminary Positioning`,
      sections: [
        {
          title: 'Client Context',
          body:
            input.companyDescription ||
            'Add company stage, growth profile, ownership model, and operating context.',
        },
        {
          title: 'Why This Search Exists Now',
          body:
            input.triggerEvent ||
            'Add trigger details: acquisition, sponsor change, succession event, or transformation mandate.',
        },
        {
          title: 'Board and Sponsor Dynamics',
          body:
            input.boardConcerns || input.boardContext ||
            'Add board expectations, sponsor operating style, and likely pressure points for first 180 days.',
        },
        {
          title: 'Board Questions and Objections',
          body: input.boardConcerns || input.boardContext
            ? [
                'What board question is most likely in round one?',
                'Which objection will matter most to the sponsor or directors?',
                'What answer should the candidate stay ready to repeat?',
              ]
            : ['Add board concerns so the draft can surface likely questions and objections.'],
        },
        {
          title: 'Search Constraints',
          body: toBulletList(input.timeline || 'Timeline, location constraints, compensation boundaries'),
        },
        {
          title: 'Must-Have Filters',
          body: toBulletList(input.mustHaves || 'Functional depth, scale pattern, sponsor pattern, leadership profile'),
        },
        {
          title: 'Candidate Story Angle',
          body:
            input.candidateSummary ||
            'Add candidate wins that map directly to mandate outcomes and board expectations.',
        },
        {
          title: 'Compensation and Offer Framing',
          body:
            input.compensationBand ||
            'Add base, bonus, equity, and notable tradeoffs you expect to discuss in final rounds.',
        },
        {
          title: 'What Not to Say',
          body: [
            'Do not open with a chronology.',
            'Do not sound generic about board dynamics.',
            'Do not overstate fit without a direct link to the mandate.',
          ],
        },
      ],
    }
  }, [input])

  return (
    <section className="mt-10 space-y-8">
      <div className="rounded-lg border border-border bg-muted p-6 sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Complete example</p>
        <h3 className="mt-2 text-2xl font-bold text-foreground">
          {sampleBrief.mandateRole} Brief: {sampleBrief.clientName}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Candidate: <span className="font-semibold text-foreground">{sampleBrief.candidateName}</span>
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {renderSection('Client Snapshot', sampleBrief.companyDescription)}
          {renderSection('Search Trigger', sampleBrief.triggerEvent)}
          {renderSection('Board Context', sampleBrief.boardContext)}
          {renderSection('Target Timeline', sampleBrief.timeline)}
          {renderSection('Must-Have Filters', toBulletList(sampleBrief.mustHaves))}
          {renderSection('Compensation', sampleBrief.compensationBand)}
        </div>

        <div className="mt-4">{renderSection('Candidate Positioning Narrative', sampleBrief.candidateSummary)}</div>

        {showGenerated && (
          <div className="mt-6 rounded-lg border border-primary/30 bg-primary/10 p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Draft output from your intake</p>
            <h4 className="mt-2 text-xl font-bold text-foreground">{generated.title}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{generated.candidateHeadline}</p>

            <div className="mt-5 space-y-4">
              {generated.sections.map((section) => (
                <div key={section.title}>{renderSection(section.title, section.body)}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border p-6 sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Bring your own client</p>
        <h3 className="mt-2 text-2xl font-bold text-foreground">Generate a draft brief from client background info</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This is practical if you can capture enough context at intake. You only need strong inputs across mandate trigger, board expectations, must-haves, and candidate profile to produce a useful first draft.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <input
            className="rounded border border-border px-3 py-2 text-sm"
            placeholder="Client company"
            value={input.clientName}
            onChange={(e) => setInput((s) => ({ ...s, clientName: e.target.value }))}
          />
          <input
            className="rounded border border-border px-3 py-2 text-sm"
            placeholder="Mandate role"
            value={input.mandateRole}
            onChange={(e) => setInput((s) => ({ ...s, mandateRole: e.target.value }))}
          />
          <textarea
            className="rounded border border-border px-3 py-2 text-sm md:col-span-2"
            rows={3}
            placeholder="Company description (size, ARR/revenue range, ownership, growth stage)"
            value={input.companyDescription}
            onChange={(e) => setInput((s) => ({ ...s, companyDescription: e.target.value }))}
          />
          <textarea
            className="rounded border border-border px-3 py-2 text-sm md:col-span-2"
            rows={3}
            placeholder="Trigger event (why this search now?)"
            value={input.triggerEvent}
            onChange={(e) => setInput((s) => ({ ...s, triggerEvent: e.target.value }))}
          />
          <textarea
            className="rounded border border-border px-3 py-2 text-sm md:col-span-2"
            rows={3}
            placeholder="Board/sponsor context"
            value={input.boardContext}
            onChange={(e) => setInput((s) => ({ ...s, boardContext: e.target.value }))}
          />
          <textarea
            className="rounded border border-border px-3 py-2 text-sm md:col-span-2"
            rows={3}
            placeholder="Board concerns or likely objections"
            value={input.boardConcerns}
            onChange={(e) => setInput((s) => ({ ...s, boardConcerns: e.target.value }))}
          />
          <input
            className="rounded border border-border px-3 py-2 text-sm"
            placeholder="Timeline"
            value={input.timeline}
            onChange={(e) => setInput((s) => ({ ...s, timeline: e.target.value }))}
          />
          <input
            className="rounded border border-border px-3 py-2 text-sm"
            placeholder="Compensation band"
            value={input.compensationBand}
            onChange={(e) => setInput((s) => ({ ...s, compensationBand: e.target.value }))}
          />
          <textarea
            className="rounded border border-border px-3 py-2 text-sm md:col-span-2"
            rows={2}
            placeholder="Must-have filters (comma, semicolon, or newline separated)"
            value={input.mustHaves}
            onChange={(e) => setInput((s) => ({ ...s, mustHaves: e.target.value }))}
          />
          <input
            className="rounded border border-border px-3 py-2 text-sm"
            placeholder="Candidate name"
            value={input.candidateName}
            onChange={(e) => setInput((s) => ({ ...s, candidateName: e.target.value }))}
          />
          <textarea
            className="rounded border border-border px-3 py-2 text-sm md:col-span-2"
            rows={3}
            placeholder="Candidate summary mapped to mandate outcomes"
            value={input.candidateSummary}
            onChange={(e) => setInput((s) => ({ ...s, candidateSummary: e.target.value }))}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowGenerated(true)}
            className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-muted"
          >
            Generate preview brief
          </button>
          <button
            type="button"
            onClick={() => {
              setInput(defaultInput)
              setShowGenerated(false)
            }}
            className="rounded border border-border px-4 py-2 text-sm font-semibold text-muted-foreground"
          >
            Reset
          </button>
        </div>

      </div>
    </section>
  )
}
