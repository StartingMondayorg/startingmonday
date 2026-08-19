'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface RadarHit {
  company_name: string
  reason: string
  signal_type: string | null
  confidence: number | null
  generated_at: string
}

const SIGNAL_LABELS: Record<string, string> = {
  exec_departure:        'Exec Departure',
  exec_hire:             'Exec Hire',
  transformation_budget: 'Transformation',
  funding:               'Funding',
  acquisition:           'Acquisition',
  expansion:             'Expansion',
  board_change:          'Board Change',
}

export function OpportunityRadar() {
  const [hits, setHits] = useState<RadarHit[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/intelligence/radar')
      .then(r => r.json())
      .then(d => {
        setHits(d.hits ?? [])
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  if (!loaded || hits.length === 0) return null

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500">Opportunity Radar</p>
        <p className="text-[11px] text-slate-400">Companies to consider adding</p>
      </div>
      <div className="space-y-2">
        {hits.map((hit, i) => (
          <Card key={i} className="flex-row items-start justify-between gap-3 p-3.5 hover:border-slate-300 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[13px] font-semibold text-slate-800">{hit.company_name}</span>
                {hit.signal_type && SIGNAL_LABELS[hit.signal_type] && (
                  <Badge variant="info" className="uppercase tracking-[0.06em]">
                    {SIGNAL_LABELS[hit.signal_type]}
                  </Badge>
                )}
              </div>
              <p className="text-[12px] text-slate-500 leading-relaxed">{hit.reason}</p>
            </div>
            <Button
              variant="link"
              size="sm"
              className="whitespace-nowrap flex-shrink-0 mt-0.5"
              render={<a href={`/dashboard/companies/new?name=${encodeURIComponent(hit.company_name)}`} />}
            >
              + Add
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
