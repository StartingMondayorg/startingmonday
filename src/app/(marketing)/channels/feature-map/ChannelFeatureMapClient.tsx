'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CHANNEL_MAPS, type ChannelKey } from './channel-feature-map-data'
import { Badge, Card, ToggleGroup, ToggleGroupItem } from '@/components/ui'
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
    <main className="min-h-screen bg-background px-4 py-12 text-foreground sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <Card variant="glass" className={`p-6 sm:p-8 ${config.border} ${config.glow}`}>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Interactive Feature Map</p>
          <h1 className="text-[30px] font-bold leading-[1.06] tracking-tight text-foreground sm:text-[42px]">
            Channel operating system, visualized by timeline.
          </h1>
          <p className="mt-4 max-w-4xl text-[15px] leading-relaxed text-foreground">Select a channel to explore its operating rhythm and visual framework.</p>

          <ToggleGroup
            value={[selected]}
            onValueChange={(values) => {
              const key = values[0] as ChannelKey | undefined
              if (key) {
                setSelected(key)
                router.replace(`/channels/feature-map?channel=${key}`, { scroll: false })
              }
            }}
            variant="outline"
            className="mt-6 flex-wrap gap-2.5"
          >
            {(Object.keys(CHANNEL_MAPS) as ChannelKey[]).map((key) => (
              <ToggleGroupItem
                key={key}
                value={key}
                className="rounded-full border-border bg-transparent px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-primary-foreground hover:text-primary-foreground aria-pressed:border-border aria-pressed:bg-primary aria-pressed:text-primary-foreground"
              >
                {CHANNEL_MAPS[key].label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Card>

        <Card variant="glass" className="mt-6 p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${config.accent}`}>{config.label}</p>
              <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-foreground">{config.intro}</p>
            </div>
            <Card variant="glass" className="px-4 py-3 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Timeline phases</p>
              <p className="mt-1 text-[24px] font-bold text-foreground">{String(phaseCount)}</p>
            </Card>
          </div>

          <div className="space-y-6">
            {config.stages.map((stage, stageIndex) => (
              <Card key={stage.phase} variant="glass" className="relative p-5 sm:p-6">
                {stageIndex < config.stages.length - 1 && (
                  <div className="pointer-events-none absolute left-[26px] top-[68px] h-[calc(100%+18px)] w-px bg-gradient-to-b from-muted/40 to-transparent" />
                )}

                <div className="mb-4 flex items-start gap-4">
                  <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-border bg-muted/60 text-[12px] font-bold text-foreground">
                    {stageIndex + 1}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{stage.phase}</p>
                    <h2 className="mt-1 text-[20px] font-semibold text-foreground">{stage.goal}</h2>
                    <p className="mt-1 text-[12px] text-muted-foreground">Cadence: {stage.cadence}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {stage.features.map((feature) => (
                    <Card key={feature.name} variant="glass" className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[14px] font-semibold text-foreground">{feature.name}</p>
                        <Badge className="rounded-full border-border bg-muted/[0.03] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                          {featureTag(feature.dashboardTag)}
                        </Badge>
                      </div>
                      <p className="mt-2 text-[13px] leading-relaxed text-foreground">{feature.benefit}</p>
                      <Card variant="glass" className="mt-3 grid gap-2 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Visual timeline cue</p>
                        <p className="text-[12px] text-foreground">{feature.visual}</p>
                        <p className="text-[11px] text-muted-foreground">Seen in: {feature.dashboardTag}</p>
                      </Card>
                    </Card>
                  ))}
                </div>

                <Card variant="glass" className="mt-4 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Feature coverage</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {stage.features.map((feature) => (
                      <Badge
                        key={`${stage.phase}-${feature.name}-coverage`}
                        className="rounded-full border-border bg-muted/[0.03] px-2.5 py-1 text-[11px] text-foreground"
                      >
                        {feature.name}
                      </Badge>
                    ))}
                  </div>
                </Card>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    </main>
  )
}
