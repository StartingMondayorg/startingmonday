'use client'
import { useState } from 'react'

const BRIEF = {
  company: 'ServiceNow',
  role: 'Chief Information Officer',
  sections: [
    {
      heading: 'Your Win Thesis',
      body: 'ServiceNow is executing a platform consolidation play - moving customers from point solutions to the full Now Platform. The CIO role is both internal (run IT at a $9B company on your own product) and external (be a credible peer to the CIOs you are selling to). Your record of consolidating fragmented technology stacks under business-aligned platforms maps directly to what they are asking customers to do. That alignment is the thesis.',
    },
    {
      heading: 'Objections They Will Raise',
      items: [
        { label: 'Scale gap', body: 'ServiceNow has 22,000 employees across 85 countries. Counter: your transformation work at [Company] scaled from 3,000 to 11,000 users across 14 countries in 18 months. The operational model you built handled the same variance in regulatory environment they face.' },
        { label: 'Product credibility', body: 'They will want the CIO to be a ServiceNow evangelist. Counter: you have deployed ServiceNow ITSM and HRSD. Speak to specific workflow decisions and the adoption metrics that followed, not the platform in general.' },
        { label: 'Enterprise SaaS vs. owned infrastructure', body: 'If your background is primarily on-prem or hybrid, they will probe cloud-first fluency. Counter with your migration record and the specific cost and reliability outcomes.' },
      ],
    },
    {
      heading: 'Questions That Signal Peer-Level Understanding',
      items: [
        { body: 'How is the internal IT organization structured relative to the product engineering org - and where does the CIO have accountability versus influence?' },
        { body: 'What is the current state of ServiceNow\'s own Now Platform adoption internally, and where are the gaps the new CIO is expected to close?' },
        { body: 'How does the CIO role interface with the Chief Customer Officer function, given that internal IT credibility is part of the external sales story?' },
      ],
    },
    {
      heading: 'Leave Out',
      body: 'Do not reference your job board experience or the number of roles you have applied to. Do not open with your resume timeline. Do not ask about work-from-home policy in round one. Do not mention compensation.',
    },
  ],
}

export function SamplePrepBrief() {
  const [open, setOpen] = useState(false)

  return (
    <section className="bg-card px-4 sm:px-6 py-14 sm:py-20 border-b border-border">
      <div className="max-w-5xl mx-auto">
        <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-primary mb-3">
          What a prep brief looks like
        </p>
        <h2 className="text-[22px] font-bold text-foreground mb-2 max-w-xl leading-snug">
          {BRIEF.company} - {BRIEF.role}
        </h2>
        <p className="text-[14px] text-muted-foreground mb-6">
          Generated from a sample executive profile. Usually generated in about a minute. No account required to read this.
        </p>

        {/* Always-visible: win thesis */}
        <div className="bg-muted border border-border rounded-lg p-6 mb-3">
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3">{BRIEF.sections[0].heading}</p>
          <p className="text-[14px] text-muted-foreground leading-relaxed">{BRIEF.sections[0].body}</p>
        </div>

        {/* Expandable: rest of brief */}
        {open ? (
          <>
            {BRIEF.sections.slice(1).map((s, i) => (
              <div key={i} className="bg-muted border border-border rounded-lg p-6 mb-3">
                <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3">{s.heading}</p>
                {s.body && <p className="text-[14px] text-muted-foreground leading-relaxed">{s.body}</p>}
                {s.items && (
                  <ul className="space-y-4">
                    {s.items.map((item, j) => (
                      <li key={j} className="text-[14px] text-muted-foreground leading-relaxed">
                        {'label' in item && <span className="font-semibold text-foreground">{item.label}: </span>}
                        {item.body}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[13px] text-muted-foreground transition-colors mt-1 bg-transparent border-0 cursor-pointer"
            >
              Show less
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-[13px] font-semibold text-muted-foreground border border-border rounded px-4 py-2 transition-colors bg-card cursor-pointer"
          >
            See objections, peer questions, and what to leave out &darr;
          </button>
        )}
      </div>
    </section>
  )
}
