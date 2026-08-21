'use client'

import { useRef, useState } from 'react'
import { Button, Card } from '@/components/ui'
type FullSignalBrief = {
  company: string
  signals: string[]
  impact: string
  recommendedAction: string
  waitlistAction: string
}

type FullPrepBrief = {
  company: string
  role: string
  search: string
  winThesis: string
  yourBackground: string
  likelyObjections: string[]
  peerLevelQuestions: string[]
  whatToLeaveOut: string
}

type SampleOutputSectionProps = {
  sampleSignalItems: string[]
  samplePrepBriefPoints: string[]
  fullSampleSignalBrief: FullSignalBrief
  fullSamplePrepBrief: FullPrepBrief
}

export function SampleOutputSection({
  sampleSignalItems,
  samplePrepBriefPoints,
  fullSampleSignalBrief,
  fullSamplePrepBrief,
}: SampleOutputSectionProps) {
  const [showFullSignal, setShowFullSignal] = useState(false)
  const [showFullPrep, setShowFullPrep] = useState(false)

  const fullSignalRef = useRef<HTMLDivElement | null>(null)
  const fullPrepRef = useRef<HTMLDivElement | null>(null)

  const revealSignalBrief = () => {
    setShowFullSignal(true)
    requestAnimationFrame(() => {
      fullSignalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const revealPrepBrief = () => {
    setShowFullPrep(true)
    requestAnimationFrame(() => {
      fullPrepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="rounded-2xl p-5">
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3">Morning signal brief</p>
          <p className="text-[14px] font-semibold text-foreground mb-3">One company moved overnight. Here is why it matters.</p>
          <ul className="space-y-2">
            {sampleSignalItems.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[13px] text-muted-foreground leading-relaxed">
                <span className="text-primary shrink-0 mt-0.5">+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-[12px] text-muted-foreground leading-relaxed mt-4">Recommended action before 10am: send the reconnection note to the former operating partner already in the client&apos;s network and update the company priority to watchlist tier one. Coach view shows the company moved from Watchlist to Active Outreach and whether the note was sent.</p>
          <Button
            type="button"
            onClick={revealSignalBrief}
            variant="link"
            className="h-auto self-start p-0 text-[12px] text-primary underline underline-offset-2 mt-4"
          >
            See full brief example -&gt;
          </Button>
        </Card>
        <Card className="rounded-2xl border border-primary/30 bg-primary/40 p-5 ring-0">
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-primary mb-3">Prep brief excerpt</p>
          <p className="text-[14px] font-semibold text-foreground mb-3">Pre-interview view for a PE-backed CIO search</p>
          <ul className="space-y-2">
            {samplePrepBriefPoints.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[13px] text-muted-foreground leading-relaxed">
                <span className="text-primary shrink-0 mt-0.5">+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-[12px] text-muted-foreground leading-relaxed mt-4">Usually ready in about a minute. Coaches review the brief before the session so the conversation stays strategic instead of reconstructive. In practice, the coach sees the same brief the client sees, plus the current pipeline stage, next follow-up date, and any fresh signal cluster tied to the company.</p>
          <Button
            type="button"
            onClick={revealPrepBrief}
            variant="link"
            className="h-auto self-start p-0 text-[12px] text-primary underline underline-offset-2 mt-4"
          >
            See full brief example -&gt;
          </Button>
        </Card>
      </div>

      {(showFullSignal || showFullPrep) && (
        <div className="mt-12 space-y-8">
          {showFullSignal && (
            <div ref={fullSignalRef} className="border-l-4 border-primary/30 bg-primary/10 rounded-r-lg p-6">
              <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-primary mb-3">Full signal brief example</p>
              <div className="space-y-3 text-[13px] text-muted-foreground">
                <p><span className="font-semibold text-foreground">Company:</span> {fullSampleSignalBrief.company}</p>
                <p><span className="font-semibold text-foreground">Signals detected:</span></p>
                <ul className="ml-4 space-y-1">
                  {fullSampleSignalBrief.signals.map((signal) => (
                    <li key={signal} className="flex items-start gap-2">
                      <span className="text-primary shrink-0 mt-0.5">+</span>
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
                <p><span className="font-semibold text-foreground">Impact analysis:</span> {fullSampleSignalBrief.impact}</p>
                <p><span className="font-semibold text-foreground">Recommended action:</span> {fullSampleSignalBrief.recommendedAction}</p>
                <p><span className="font-semibold text-foreground">Watchlist note:</span> {fullSampleSignalBrief.waitlistAction}</p>
              </div>
            </div>
          )}

          {showFullPrep && (
            <div ref={fullPrepRef} className="border-l-4 border-primary/30 bg-primary/70 rounded-r-lg p-6">
              <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-primary mb-4">Full prep brief example</p>
              <div className="space-y-4 text-[13px] text-muted-foreground">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <p><span className="font-semibold text-foreground">Company:</span><br />{fullSamplePrepBrief.company}</p>
                  <p><span className="font-semibold text-foreground">Target role:</span><br />{fullSamplePrepBrief.role}</p>
                  <p><span className="font-semibold text-foreground">Search type:</span><br />{fullSamplePrepBrief.search}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Win thesis:</p>
                  <p className="ml-2">{fullSamplePrepBrief.winThesis}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Your background:</p>
                  <p className="ml-2">{fullSamplePrepBrief.yourBackground}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-2">Likely objections:</p>
                  <ul className="ml-4 space-y-1">
                    {fullSamplePrepBrief.likelyObjections.map((obj) => (
                      <li key={obj} className="flex items-start gap-2">
                        <span className="text-primary shrink-0 mt-0.5">.</span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-2">Peer-level questions:</p>
                  <ul className="ml-4 space-y-1">
                    {fullSamplePrepBrief.peerLevelQuestions.map((q) => (
                      <li key={q} className="flex items-start gap-2">
                        <span className="text-primary shrink-0 mt-0.5">?</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">What to leave out:</p>
                  <p className="ml-2">{fullSamplePrepBrief.whatToLeaveOut}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}