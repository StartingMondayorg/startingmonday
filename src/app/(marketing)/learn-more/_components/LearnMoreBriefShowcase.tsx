'use client'

import { useState } from 'react'
import Link from 'next/link'

const BRIEF = {
  company: 'ServiceNow',
  role: 'Chief Information Officer',
  bottomLine: [
    'Your decisive advantage is your platform consolidation record: you have done operationally what ServiceNow is asking its enterprise customers to pay to do.',
    'The objection that will kill your candidacy is product credibility - if you cannot speak to your own ServiceNow deployment with specificity, they will not trust you to be the internal reference customer the external sales story requires.',
    'Win this conversation by naming which workflows you deployed, the adoption metrics that followed, and the one decision that did not go as planned.',
  ],
  winThesis:
    'ServiceNow is executing a platform consolidation play: moving customers from point solutions to the full Now Platform. The CIO role is both internal (run IT at a $9B company on your own product) and external (be a credible peer to the CIOs they are selling to). Your record of consolidating fragmented technology stacks under business-aligned platforms maps directly to what they are asking their customers to do. That alignment is the thesis.',
  objections: [
    {
      push: 'You scaled at [Company], but ServiceNow operates across 22,000 employees in 85 countries. Is that experience really transferable?',
      say: 'Your transformation work at [Company] scaled from 3,000 to 11,000 users across 14 countries in 18 months. The operational model you built handled the same regulatory variance they face. Scale is a number. Operating architecture is the variable that matters.',
    },
    {
      push: 'We need a CIO who is a genuine ServiceNow evangelist. Can you credibly be that externally?',
      say: 'You deployed ServiceNow ITSM and HRSD. Name the specific workflow decisions, the adoption curve, and what you would do differently. Evangelism built on personal deployment experience lands differently than platform advocacy. You have the former.',
    },
    {
      push: 'Your background is primarily on-premises or hybrid. How cloud-first are you really?',
      say: 'Reference your migration record and the specific cost and reliability outcomes. Show the decision logic: when you moved to cloud, what triggered it, what you kept on-prem and why, and what you would not repeat.',
    },
  ],
  questions: [
    {
      body: 'How is the internal IT organization structured relative to the product engineering org - and where does the CIO have accountability versus influence?',
      probing: 'Whether you understand the CIO is a business-political role as much as a technical one.',
    },
    {
      body: 'What is the current state of the Now Platform adoption internally, and where are the gaps the new CIO is expected to close?',
      probing: 'Whether you know the internal credibility gap is the actual mandate, not just running IT efficiently.',
    },
    {
      body: 'How does the CIO role interface with the Chief Customer Officer function, given that internal IT is part of the external sales story?',
      probing: 'Whether you grasp the dual mandate before they explain it. Most candidates do not.',
    },
  ],
  leaveOut: [
    'Do not open with your resume timeline. Lead with the transformation outcome, not the chronology.',
    'Do not position yourself as a technology enthusiast. Position as a business executive who runs technology accountability.',
    'Do not ask about compensation or remote policy in the first conversation.',
    'Do not speak generically about ServiceNow as a platform. Only reference it from deployment experience. Vague enthusiasm reads as a red flag.',
  ],
}

export function LearnMoreBriefShowcase() {
  const [open, setOpen] = useState(false)

  return (
    <section className="mt-12 rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,165,0,0.07),rgba(255,165,0,0.01))] p-5 sm:p-8">
      <div className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-200">Sample prep brief</p>
        <h2 className="mt-3 text-[1.6rem] font-serif leading-tight text-white sm:text-[2rem]">
          {BRIEF.company} - {BRIEF.role}
        </h2>
        <p className="mt-3 text-[13px] leading-relaxed text-slate-400">
          Generated from a sample executive profile. This is what goes into every conversation.
        </p>
      </div>

      {/* Bottom Line - always visible */}
      <div className="mt-7 rounded-2xl border border-orange-300/20 bg-orange-300/[0.05] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-300">Bottom line</p>
        <ol className="mt-4 space-y-3">
          {BRIEF.bottomLine.map((sentence, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-[11px] font-bold text-orange-300">
                {i + 1}
              </span>
              <p className="text-[14px] leading-relaxed text-slate-100">{sentence}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Win Thesis - always visible */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-300">Win thesis</p>
        <p className="mt-4 text-[14px] leading-relaxed text-slate-100">{BRIEF.winThesis}</p>
      </div>

      {/* Expandable sections */}
      {open ? (
        <>
          {/* Anticipated Pushback */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-300">Anticipated pushback</p>
            <div className="mt-4 space-y-5">
              {BRIEF.objections.map((obj, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex gap-2.5">
                    <span className="mt-0.5 shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-500">They push:</span>
                    <p className="text-[13px] leading-relaxed text-slate-300">{obj.push}</p>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="mt-0.5 shrink-0 text-[11px] font-bold uppercase tracking-wide text-orange-400">You say:</span>
                    <p className="text-[13px] leading-relaxed text-slate-100">{obj.say}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Likely Questions */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-300">Questions to ask - peer level</p>
            <div className="mt-4 space-y-5">
              {BRIEF.questions.map((q, i) => (
                <div key={i} className="space-y-1.5">
                  <p className="text-[14px] font-semibold leading-snug text-white">{q.body}</p>
                  <p className="text-[12px] leading-relaxed text-slate-400">
                    <span className="font-semibold text-slate-500">What it signals: </span>
                    {q.probing}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Leave Out */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-300">What to leave out</p>
            <ul className="mt-4 space-y-2.5">
              {BRIEF.leaveOut.map((item, i) => (
                <li key={i} className="flex gap-3 text-[13px] leading-relaxed text-slate-300">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-4 cursor-pointer border-0 bg-transparent text-[12px] text-slate-500 transition-colors hover:text-slate-300"
          >
            Show less
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 cursor-pointer rounded-xl border border-white/10 bg-slate-950/30 px-4 py-2.5 text-[13px] font-semibold text-slate-200 transition-colors hover:border-white/20 hover:text-white"
        >
          See objections, peer questions, and what to leave out ↓
        </button>
      )}

      <div className="mt-7 flex flex-col items-start gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:gap-5">
        <Link
          href="/demo"
          className="inline-flex items-center rounded-full bg-orange-500 px-5 py-2.5 text-[14px] font-semibold text-slate-950 transition-colors hover:bg-orange-600"
        >
          Generate your own brief
        </Link>
        <p className="text-[12px] text-slate-400">Free for 30 days. No credit card. Usually ready in about a minute.</p>
      </div>
    </section>
  )
}
