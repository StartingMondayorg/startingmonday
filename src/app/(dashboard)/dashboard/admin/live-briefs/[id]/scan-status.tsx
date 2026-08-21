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

  if (message) return <p role="status" className="rounded border border-red-200 bg-red-50 p-4 text-[12px] text-red-700">{message}</p>
  if (!data) return null

  return (
    <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500">Scan status</h2>
        <span className="rounded bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-amber-700">{data.run.status.replaceAll('_', ' ')}</span>
      </div>
      <p className="mt-2 text-[12px] text-slate-500">{data.run.completed_company_count ?? 0} complete · {data.run.blocked_company_count ?? 0} blocked · {data.run.failed_company_count ?? 0} failed · {data.run.selected_company_count} selected</p>
      <ul className="mt-4 divide-y divide-slate-100 rounded border border-slate-200">{data.companies.map((company) => <li key={company.id} className="flex items-center justify-between gap-3 px-3 py-2 text-[12px]"><span className="font-semibold text-slate-800">{company.company_name}</span><span className={company.status === 'failed' || company.status === 'blocked_by_source_policy' ? 'text-red-700' : 'text-slate-500'}>{company.error_class ?? company.status.replaceAll('_', ' ')}</span></li>)}</ul>
    </div>
  )
}