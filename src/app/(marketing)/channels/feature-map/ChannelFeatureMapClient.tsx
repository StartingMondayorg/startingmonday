'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CHANNEL_MAPS, type ChannelKey } from './channel-feature-map-data'

export function ChannelFeatureMapClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selected, setSelected] = useState<ChannelKey>('coaches')

  useEffect(() => {
    const param = searchParams.get('channel')
    if (param === 'coaches' || param === 'outplacement' || param === 'executives' || param === 'search_firms') {
      setSelected(param)
    }
  }, [searchParams])

  const config = CHANNEL_MAPS[selected]

  const phaseCount = useMemo(() => config.stages.length, [config.stages.length])
  const featureTag = (dashboardTag: string) => {
    const parts = dashboardTag.split('/').map((part) => part.trim())
    return parts[parts.length - 1] || 'Feature'
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <header className={`rounded-[1.75rem] border bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8 ${config.border} ${config.glow}`}>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-orange-300">Interactive Feature Map</p>
          <h1 className="text-[30px] font-bold leading-[1.06] tracking-tight text-white sm:text-[42px]">
            Channel operating system, visualized by timeline.
          </h1>
          <p className="mt-4 max-w-4xl text-[15px] leading-relaxed text-slate-200">Select a channel to explore its operating rhythm and visual framework.</p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {(Object.keys(CHANNEL_MAPS) as ChannelKey[]).map((key) => {
              const isActive = key === selected
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelected(key)
                    router.replace(`/channels/feature-map?channel=${key}`, { scroll: false })
                  }}
                  className={`rounded-full border px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors ${
                    isActive
                      ? 'border-white/70 bg-white text-slate-900'
                      : 'border-white/20 bg-transparent text-slate-200 hover:border-white/45 hover:text-white'
                  }`}
                >
                  {CHANNEL_MAPS[key].label}
                </button>
              )
            })}
          </div>
        </header>

        <section className="mt-6 rounded-3xl border border-white/10 bg-slate-900/55 p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${config.accent}`}>{config.label}</p>
              <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-slate-200">{config.intro}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Timeline phases</p>
              <p className="mt-1 text-[24px] font-bold text-white">{String(phaseCount)}</p>
            </div>
          </div>

          <div className="space-y-6">
            {config.stages.map((stage, stageIndex) => (
              <article key={stage.phase} className="relative rounded-2xl border border-white/12 bg-white/[0.03] p-5 sm:p-6">
                {stageIndex < config.stages.length - 1 && (
                  <div className="pointer-events-none absolute left-[26px] top-[68px] h-[calc(100%+18px)] w-px bg-gradient-to-b from-white/40 to-transparent" />
                )}

                <div className="mb-4 flex items-start gap-4">
                  <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-white/35 bg-white/10 text-[12px] font-bold text-white">
                    {stageIndex + 1}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-300">{stage.phase}</p>
                    <h2 className="mt-1 text-[20px] font-semibold text-white">{stage.goal}</h2>
                    <p className="mt-1 text-[12px] text-slate-300">Cadence: {stage.cadence}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {stage.features.map((feature) => (
                    <div key={feature.name} className="rounded-xl border border-white/12 bg-slate-950/50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[14px] font-semibold text-white">{feature.name}</p>
                        <span className="rounded-full border border-white/20 bg-white/[0.03] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-300">
                          {featureTag(feature.dashboardTag)}
                        </span>
                      </div>
                      <p className="mt-2 text-[13px] leading-relaxed text-slate-200">{feature.benefit}</p>
                      <div className="mt-3 grid gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Visual timeline cue</p>
                        <p className="text-[12px] text-slate-200">{feature.visual}</p>
                        <p className="text-[11px] text-slate-400">Seen in: {feature.dashboardTag}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-white/12 bg-slate-950/40 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Feature coverage</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {stage.features.map((feature) => (
                      <span
                        key={`${stage.phase}-${feature.name}-coverage`}
                        className="rounded-full border border-white/15 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-200"
                      >
                        {feature.name}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
