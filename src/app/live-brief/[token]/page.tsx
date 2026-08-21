'use client'

import { useEffect, useState } from 'react'

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
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    params.then(({ token: routeToken }) => {
      setToken(routeToken)
      return fetch(`/api/live-brief/${routeToken}`, { cache: 'no-store' })
    }).then(async (response) => {
      const result = await response.json() as { artifact?: Artifact; error?: string }
      if (!active) return
      if (!response.ok || !result.artifact) throw new Error(result.error ?? 'This brief is no longer available.')
      setArtifact(result.artifact)
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

  if (error) return <main className="flex min-h-screen items-center justify-center bg-[#f4f1eb] px-6"><div className="max-w-md text-center"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-700">Starting Monday</p><h1 className="mt-4 text-3xl font-semibold text-slate-900">This brief is no longer available</h1><p className="mt-3 text-sm leading-6 text-slate-600">The private link may have expired or been revoked.</p></div></main>
  if (!artifact) return <main className="flex min-h-screen items-center justify-center bg-[#f4f1eb] px-6"><p className="text-sm text-slate-500">Loading private brief…</p></main>

  const payload = artifact.brief_payload
  const title = typeof payload.title === 'string' ? payload.title : 'Private career brief'
  const sections = Array.isArray(payload.sections) ? payload.sections : []
  const bookingUrl = process.env.NEXT_PUBLIC_HUBSPOT_MEETINGS_URL ?? '#'

  return (
    <main className="min-h-screen bg-[#f4f1eb] text-slate-900">
      <header className="border-b border-slate-900/10 bg-[#17212b] text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <span className="text-[13px] font-bold uppercase tracking-[0.16em]">Starting <span className="text-orange-400">Monday</span></span>
          <span className="text-[11px] uppercase tracking-[0.14em] text-slate-300">Private brief</span>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-700">Prepared for your next move</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl">{title}</h1>
        <p className="mt-4 text-sm text-slate-500">A private, evidence-labeled brief prepared by Starting Monday.</p>

        <div className="mt-10 space-y-5">
          {sections.length > 0 ? sections.map((section, index) => {
            const content: Record<string, unknown> = isRecord(section) ? section : { content: section }
            const name = typeof content.title === 'string' ? content.title : `Section ${index + 1}`
            return <section key={`${name}-${index}`} onClick={() => void record('delivery_section_viewed', name)} className="border-t border-slate-900/15 py-6"><h2 className="text-xl font-semibold text-slate-900">{name}</h2><div className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{typeof content.content === 'string' ? content.content : JSON.stringify(content, null, 2)}</div></section>
          }) : <section className="border-t border-slate-900/15 py-6"><h2 className="text-xl font-semibold">{sectionTitle(title)}</h2><pre className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{JSON.stringify(payload, null, 2)}</pre></section>}
        </div>

        <section className="mt-10 border-y border-slate-900/15 py-8"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-700">Next step</p><h2 className="mt-3 text-2xl font-semibold">Go deeper with Rich</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Book a working session to pressure-test the strongest opportunities and decide what to do next.</p><a href={bookingUrl} onClick={() => void record('delivery_cta_clicked')} className="mt-6 inline-flex rounded bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700">Book a working session</a></section>
        <footer className="pt-8 text-[11px] leading-5 text-slate-500">This private link is time-limited. Access is logged to help the sender understand whether the brief was received. Sources and limits are preserved in the brief artifact.</footer>
      </div>
    </main>
  )
}