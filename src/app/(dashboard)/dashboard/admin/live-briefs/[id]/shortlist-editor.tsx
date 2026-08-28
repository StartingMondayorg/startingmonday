'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Company = { company_key: string; company_name: string; career_page_url: string; target_role_lane: string }

const emptyCompany: Company = { company_key: '', company_name: '', career_page_url: '', target_role_lane: '' }

export default function ShortlistEditor({ requestId, enabled }: { requestId: string; enabled: boolean }) {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [draft, setDraft] = useState(emptyCompany)
  const [message, setMessage] = useState('')
  const [working, setWorking] = useState(false)

  function addCompany() {
    if (!draft.company_key.trim() || !draft.company_name.trim() || companies.length >= 10) return
    if (companies.some((company) => company.company_key === draft.company_key.trim())) {
      setMessage('Company key must be unique')
      return
    }
    setCompanies((current) => [...current, { ...draft, company_key: draft.company_key.trim(), company_name: draft.company_name.trim() }])
    setDraft(emptyCompany)
    setMessage('')
  }

  async function startScan() {
    if (companies.length === 0) return
    setWorking(true)
    setMessage('')
    try {
      const response = await fetch(`/api/admin/live-briefs/${requestId}/scan`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idempotency_key: crypto.randomUUID(), companies }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error ?? 'Unable to start scan')
      setMessage('Scan queued')
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to start scan')
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="rounded border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Manual shortlist</h2>
        <span className="text-[11px] text-muted-foreground">{companies.length}/10 selected</span>
      </div>
      <p className="mt-2 text-[12px] text-muted-foreground">Verify companies and role paths in Sales Navigator, then add the companies approved for this scan.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <input disabled={!enabled || companies.length >= 10} value={draft.company_name} onChange={(event) => setDraft({ ...draft, company_name: event.target.value })} placeholder="Company name" className="h-9 rounded border border-border px-3 text-[12px] outline-none focus:border-primary/30 disabled:bg-muted" />
        <input disabled={!enabled || companies.length >= 10} value={draft.company_key} onChange={(event) => setDraft({ ...draft, company_key: event.target.value })} placeholder="Stable company key" className="h-9 rounded border border-border px-3 text-[12px] outline-none focus:border-primary/30 disabled:bg-muted" />
        <input disabled={!enabled || companies.length >= 10} value={draft.career_page_url} onChange={(event) => setDraft({ ...draft, career_page_url: event.target.value })} placeholder="Career page URL (optional)" className="h-9 rounded border border-border px-3 text-[12px] outline-none focus:border-primary/30 disabled:bg-muted" />
        <input disabled={!enabled || companies.length >= 10} value={draft.target_role_lane} onChange={(event) => setDraft({ ...draft, target_role_lane: event.target.value })} placeholder="Target role lane (optional)" className="h-9 rounded border border-border px-3 text-[12px] outline-none focus:border-primary/30 disabled:bg-muted" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={!enabled || companies.length >= 10} onClick={addCompany} className="rounded border border-border bg-card px-3 py-2 text-[12px] font-semibold text-muted-foreground disabled:opacity-50">Add company</button>
        <button type="button" disabled={!enabled || companies.length === 0 || working} onClick={startScan} className="rounded bg-primary px-3 py-2 text-[12px] font-semibold text-primary-foreground disabled:opacity-50">{working ? 'Starting…' : 'Start bounded scan'}</button>
      </div>
      {companies.length > 0 && <ul className="mt-4 divide-y divide-border rounded border border-border">{companies.map((company, index) => <li key={company.company_key} className="flex items-center justify-between gap-3 px-3 py-2 text-[12px]"><span><strong className="text-foreground">{company.company_name}</strong><span className="ml-2 text-muted-foreground">{company.target_role_lane || 'Role lane not set'}</span></span><button type="button" onClick={() => setCompanies((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-destructive">Remove</button></li>)}</ul>}
      {message && <p role="status" className="mt-3 text-[12px] text-muted-foreground">{message}</p>}
    </div>
  )
}