'use client'

import { useEffect, useState } from 'react'
import { parsePeopleToKnowHandoffs } from '@/lib/people-to-know-handoff'
import PeopleToKnowSection from './people-to-know-section'

type Artifact = { version: number; brief_payload: Record<string, unknown>; content_hash: string }

function sectionTitle(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export default function LiveBriefPublicPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState('')
  const [artifact, setArtifact] = useState<Artifact | null>(null)
  const [peopleHandoffEnabled, setPeopleHandoffEnabled] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    params.then(({ token: routeToken }) => {
      setToken(routeToken)
      return fetch(`/api/live-brief/${routeToken}`, { cache: 'no-store' })
    }).then(async (response) => {
      const result = await response.json() as { artifact?: Artifact; capabilities?: { people_to_know_handoff?: boolean }; error?: string }
      if (!active) return
      if (!response.ok || !result.artifact) throw new Error(result.error ?? 'This brief is no longer available.')
      setArtifact(result.artifact)
      setPeopleHandoffEnabled(result.capabilities?.people_to_know_handoff === true)
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'This brief is no longer available.')
    })
    return () => { active = false }
  }, [params])

  async function record(eventType: 'delivery_section_viewed' | 'delivery_cta_clicked', section?: string) {
    if (!token) return
    await fetch(`/api/live-brief/${token}/events`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event_type: eventType, ...(section ? { section } : {}) }),
    }).catch(() => {})
  }

  async function recordHandoff(destination: 'linkedin' | 'apollo') {
    if (!token) return
    await fetch(`/api/live-brief/${token}/events`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event_type: 'delivery_handoff_clicked', destination }),
      keepalive: true,
    }).catch(() => {})
  }

  if (error) return <main className="flex min-h-screen items-center justify-center bg-background px-6"><div className="max-w-md text-center"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Starting Monday</p><p role="heading" aria-level={1} className="mt-4 text-3xl font-semibold text-foreground">This brief is no longer available</p><p className="mt-3 text-sm leading-6 text-muted-foreground">The private link may have expired or been revoked.</p></div></main>
  if (!artifact) return <main className="flex min-h-screen items-center justify-center bg-background px-6"><p className="text-sm text-muted-foreground">Loading private brief…</p></main>

  const payload = artifact.brief_payload
  const title = typeof payload.title === 'string' ? payload.title : 'Private career brief'
  const sections = Array.isArray(payload.sections) ? payload.sections : []
  const bookingUrl = process.env.NEXT_PUBLIC_HUBSPOT_MEETINGS_URL ?? '#'

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/10 bg-card text-card-foreground">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <span className="text-[13px] font-bold uppercase tracking-[0.16em]">Starting <span className="text-primary">Monday</span></span>
          <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Private brief</span>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Prepared for your next move</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">{title}</h1>
        <p className="mt-4 text-sm text-muted-foreground">A private, evidence-labeled brief prepared by Starting Monday.</p>

        <div className="mt-10 space-y-5">
          {sections.length > 0 ? sections.map((section, index) => {
            const content: Record<string, unknown> = isRecord(section) ? section : { content: section }
            const name = typeof content.title === 'string' ? content.title : `Section ${index + 1}`
            const peopleEntries = peopleHandoffEnabled ? parsePeopleToKnowHandoffs(content) : []
            if (peopleEntries.length > 0) {
              return <PeopleToKnowSection key={`${name}-${index}`} entries={peopleEntries} onHandoff={(destination) => void recordHandoff(destination)} />
            }
            return <section key={`${name}-${index}`} onClick={() => void record('delivery_section_viewed', name)} className="border-t border-border/15 py-6"><h2 className="text-xl font-semibold text-foreground">{name}</h2><div className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-muted-foreground">{typeof content.content === 'string' ? content.content : JSON.stringify(content, null, 2)}</div></section>
          }) : <section className="border-t border-border/15 py-6"><h2 className="text-xl font-semibold">{sectionTitle(title)}</h2><pre className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-muted-foreground">{JSON.stringify(payload, null, 2)}</pre></section>}
        </div>

        <section className="mt-10 border-y border-border/15 py-8"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Next step</p><h2 className="mt-3 text-2xl font-semibold">Go deeper with Rich</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Book a working session to pressure-test the strongest opportunities and decide what to do next.</p><a href={bookingUrl} onClick={() => void record('delivery_cta_clicked')} className="mt-6 inline-flex rounded bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Book a working session</a></section>
        <footer className="pt-8 text-[11px] leading-5 text-muted-foreground">Private by default. This link is time-limited, and access is logged to help the sender understand whether the brief was received. Sources and limits are preserved in the brief artifact.</footer>
      </div>
    </main>
  )
}