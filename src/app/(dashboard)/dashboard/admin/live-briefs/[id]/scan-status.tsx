'use client'

import { useEffect, useState } from 'react'

type ScanStatus = {
  run: { id: string; status: string; selected_company_count: number; completed_company_count?: number; blocked_company_count?: number; failed_company_count?: number }
  companies: { id: string; company_name: string; status: string; error_class?: string | null }[]
}

const TERMINAL = new Set(['completed', 'failed', 'canceled'])

export default function ScanStatus({ requestId }: { requestId: string }) {
  const [data, setData] = useState<ScanStatus | null>(null)
  const [message, setMessage] = useState('')
  const [accepting, setAccepting] = useState(false)

  async function acceptPartial() {
    if (!data) return
    setAccepting(true)
    setMessage('')
    try {
      const response = await fetch(`/api/admin/live-briefs/${requestId}/scan/partial`, { method: 'POST' })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error ?? 'Unable to accept partial results')
      setData({ ...data, run: { ...data.run, status: 'partial_ready' } })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to accept partial results')
    } finally {
      setAccepting(false)
    }
  }

  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined

    async function load() {
      try {
        const response = await fetch(`/api/admin/live-briefs/${requestId}/scan`, { cache: 'no-store' })
        if (response.status === 404) return
        const result = await response.json() as ScanStatus | { error?: string }
        if (!response.ok) throw new Error('error' in result ? result.error : 'Unable to load scan status')
        if (!active) return
        setData(result as ScanStatus)
        if (!TERMINAL.has((result as ScanStatus).run.status)) timer = setTimeout(load, 5_000)
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : 'Unable to load scan status')
      }
    }

    load()
    return () => { active = false; if (timer) clearTimeout(timer) }
  }, [requestId])

  if (message) return <p role="status" className="rounded border border-destructive/30 bg-destructive/10 p-4 text-[12px] text-destructive">{message}</p>
  if (!data) return null

  return (
    <div className="rounded border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Scan status</h2>
        <span className="rounded bg-warning/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-warning">{data.run.status.replaceAll('_', ' ')}</span>
      </div>
      <p className="mt-2 text-[12px] text-muted-foreground">{data.run.completed_company_count ?? 0} complete · {data.run.blocked_company_count ?? 0} blocked · {data.run.failed_company_count ?? 0} failed · {data.run.selected_company_count} selected</p>
      {!TERMINAL.has(data.run.status) && <button type="button" onClick={acceptPartial} disabled={accepting} className="mt-4 rounded border border-primary/30 bg-primary/10 px-3 py-2 text-[12px] font-semibold text-primary disabled:opacity-50">{accepting ? 'Accepting…' : 'Accept partial results'}</button>}
      <ul className="mt-4 divide-y divide-border rounded border border-border">{data.companies.map((company) => <li key={company.id} className="flex items-center justify-between gap-3 px-3 py-2 text-[12px]"><span className="font-semibold text-foreground">{company.company_name}</span><span className={company.status === 'failed' || company.status === 'blocked_by_source_policy' ? 'text-destructive' : 'text-muted-foreground'}>{company.error_class ?? company.status.replaceAll('_', ' ')}</span></li>)}</ul>
    </div>
  )
}