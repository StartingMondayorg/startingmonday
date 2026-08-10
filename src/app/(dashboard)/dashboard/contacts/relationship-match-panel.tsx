'use client'

import { useMemo, useState } from 'react'

type CompanyOption = {
  id: string
  name: string
}

type UploadOption = {
  id: string
  label: string
}

type MatchItem = {
  match_id: string
  candidate_name: string
  candidate_title: string | null
  connection_name: string
  connection_company: string | null
  candidate_source?: string
  connection_profile_url: string | null
  confidence_tier: 'high' | 'medium' | 'low' | 'rejected'
  overall_score: number
  user_confirmed: boolean
}

type MatchResponse = {
  upload_id: string | null
  likely_known: MatchItem[]
  suggested_matches: MatchItem[]
  confirmed_relationships: MatchItem[]
}

export function RelationshipMatchPanel({ companies, uploads }: { companies: CompanyOption[]; uploads: UploadOption[] }) {
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '')
  const [uploadId, setUploadId] = useState(uploads[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [actingMatchId, setActingMatchId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [data, setData] = useState<MatchResponse | null>(null)
  const [confirmChecks, setConfirmChecks] = useState<Record<string, boolean>>({})
  const [profileCorrections, setProfileCorrections] = useState<Record<string, string>>({})

  const hasCompany = useMemo(() => companyId.length > 0, [companyId])
  const hasUploads = uploads.length > 0

  async function runMatch() {
    if (!hasCompany) return
    setLoading(true)
    setError(null)
    setActionMessage(null)

    try {
      const qs = new URLSearchParams({ company_id: companyId })
      if (uploadId.trim().length > 0) {
        qs.set('upload_id', uploadId.trim())
      }

      const response = await fetch(`/api/linkedin-import/match?${qs.toString()}`, { method: 'GET' })
      const payload = await response.json()
      if (!response.ok) {
        setError(payload?.error ?? 'Failed to load relationship matches.')
        setData(null)
        return
      }

      setData(payload as MatchResponse)
    } catch {
      setError('Failed to load relationship matches.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  function getCorrection(matchId: string): string | undefined {
    const value = profileCorrections[matchId]?.trim() ?? ''
    return value.length > 0 ? value : undefined
  }

  function splitName(fullName: string): { firstName: string; lastName: string } {
    const parts = fullName.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return { firstName: '', lastName: '' }
    if (parts.length === 1) return { firstName: parts[0], lastName: '' }
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
  }

  function csvCell(value: string): string {
    return `"${value.replace(/"/g, '""')}"`
  }

  function exportConfirmedRelationships() {
    if (!data || data.confirmed_relationships.length === 0) return

    const header = [
      'First Name',
      'Last Name',
      'Company',
      'LinkedIn URL',
      'Title',
      'Group Company',
      'Matched Connection',
      'Provenance',
      'Confidence Tier',
    ]

    const rows = data.confirmed_relationships.map((item) => {
      const { firstName, lastName } = splitName(item.candidate_name)
      return [
        firstName,
        lastName,
        item.connection_company ?? '',
        item.connection_profile_url ?? '',
        item.candidate_title ?? '',
        item.connection_company ?? '',
        item.connection_name,
        item.candidate_source ?? 'candidate+linkedin_export',
        item.confidence_tier,
      ]
    })

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => csvCell(String(cell))).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `confirmed-relationships-sales-navigator-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  async function confirmMatch(matchId: string) {
    if (!confirmChecks[matchId]) {
      setError('Check the explicit confirmation box before confirming a relationship.')
      return
    }

    setActingMatchId(matchId)
    setError(null)
    setActionMessage(null)

    const response = await fetch('/api/linkedin-import/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        match_id: matchId,
        confirm: true,
        profile_url_correction: getCorrection(matchId),
      }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      setError(payload?.error ?? 'Could not confirm relationship.')
      setActingMatchId(null)
      return
    }

    setActionMessage('Relationship confirmed and contact added.')
    await runMatch()
    setActingMatchId(null)
  }

  async function rejectMatch(matchId: string) {
    setActingMatchId(matchId)
    setError(null)
    setActionMessage(null)

    const response = await fetch('/api/linkedin-import/match', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        match_id: matchId,
        profile_url_correction: getCorrection(matchId),
      }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      setError(payload?.error ?? 'Could not reject relationship suggestion.')
      setActingMatchId(null)
      return
    }

    setActionMessage('Relationship suggestion rejected.')
    await runMatch()
    setActingMatchId(null)
  }

  return (
    <section className="mb-6 rounded-2xl border border-white/15 bg-white/5 p-5 shadow-[0_22px_66px_rgba(15,23,42,0.18)] backdrop-blur-md">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-orange-300">Relationship matching</p>
          <p className="mt-1 text-[13px] text-slate-200">Find likely connections from uploaded LinkedIn contacts and candidate records.</p>
        </div>
      </div>

      {!hasUploads && (
        <p className="mb-4 rounded border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">
          Upload a LinkedIn connections CSV above before running company matching.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <label className="text-[12px] text-slate-200">
          Company
          <select
            value={companyId}
            onChange={(event) => setCompanyId(event.target.value)}
            className="mt-1 block min-h-[44px] w-full rounded border border-white/15 bg-slate-950/70 px-3 text-[13px] text-slate-100"
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
        </label>

        <label className="text-[12px] text-slate-200">
          LinkedIn upload
          <select
            value={uploadId}
            onChange={(event) => setUploadId(event.target.value)}
            className="mt-1 block min-h-[44px] w-full rounded border border-white/15 bg-slate-950/70 px-3 text-[13px] text-slate-100"
            disabled={!hasUploads}
          >
            {hasUploads ? (
              uploads.map((upload) => (
                <option key={upload.id} value={upload.id}>{upload.label}</option>
              ))
            ) : (
              <option value="">No processed uploads yet</option>
            )}
          </select>
        </label>

        <button
          type="button"
          onClick={runMatch}
          disabled={!hasCompany || !hasUploads || loading}
          className="inline-flex min-h-[44px] items-center justify-center rounded bg-orange-500 px-4 text-[13px] font-semibold text-slate-950 transition-colors hover:bg-orange-400 disabled:opacity-50"
        >
          {loading ? 'Matching…' : 'Run match'}
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200">
          {error}
        </p>
      )}

      {actionMessage && (
        <p className="mt-3 rounded border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-200">
          {actionMessage}
        </p>
      )}

      {data && (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
            <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-300">Likely known to you</p>
            {data.likely_known.length === 0 ? (
              <p className="mt-2 text-[13px] text-slate-300">No high or medium-confidence matches yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {data.likely_known.map((item) => (
                  <li key={item.match_id} className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2">
                    <p className="text-[13px] font-semibold text-white">{item.candidate_name} <span className="font-normal text-slate-300">({item.candidate_title ?? 'Role unknown'})</span></p>
                    <p className="mt-1 text-[12px] text-slate-300">Matched to your connection: {item.connection_name}{item.connection_company ? ` at ${item.connection_company}` : ''}</p>
                    <label className="mt-2 block text-[11px] text-slate-300">
                      Correct LinkedIn profile URL (optional)
                      <input
                        type="url"
                        value={profileCorrections[item.match_id] ?? ''}
                        onChange={(event) => setProfileCorrections((prev) => ({ ...prev, [item.match_id]: event.target.value }))}
                        placeholder={item.connection_profile_url ?? 'https://linkedin.com/in/...'}
                        className="mt-1 block min-h-[36px] w-full rounded border border-white/15 bg-slate-950/75 px-2.5 text-[12px] text-slate-100 placeholder:text-slate-500"
                      />
                    </label>
                    <label className="mt-2 inline-flex min-h-[36px] items-center gap-2 text-[12px] text-slate-200">
                      <input
                        type="checkbox"
                        checked={Boolean(confirmChecks[item.match_id])}
                        onChange={(event) => setConfirmChecks((prev) => ({ ...prev, [item.match_id]: event.target.checked }))}
                      />
                      I confirm this is a known relationship.
                    </label>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] uppercase tracking-[0.08em] text-slate-200">{item.confidence_tier}</span>
                      <button
                        type="button"
                        onClick={() => confirmMatch(item.match_id)}
                        disabled={actingMatchId === item.match_id}
                        className="inline-flex min-h-[36px] items-center rounded border border-emerald-300/30 bg-emerald-500/10 px-2.5 text-[12px] font-semibold text-emerald-200"
                      >
                        Confirm + add contact
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectMatch(item.match_id)}
                        disabled={actingMatchId === item.match_id}
                        className="inline-flex min-h-[36px] items-center rounded border border-rose-300/30 bg-rose-500/10 px-2.5 text-[12px] font-semibold text-rose-200"
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
            <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-300">Needs review</p>
            {data.suggested_matches.length === 0 ? (
              <p className="mt-2 text-[13px] text-slate-300">No low-confidence suggestions yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {data.suggested_matches.map((item) => (
                  <li key={item.match_id} className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2">
                    <p className="text-[13px] font-semibold text-white">{item.candidate_name}</p>
                    <p className="mt-1 text-[12px] text-slate-300">Potential overlap with {item.connection_name}</p>
                    <label className="mt-2 block text-[11px] text-slate-300">
                      Correct LinkedIn profile URL (optional)
                      <input
                        type="url"
                        value={profileCorrections[item.match_id] ?? ''}
                        onChange={(event) => setProfileCorrections((prev) => ({ ...prev, [item.match_id]: event.target.value }))}
                        placeholder={item.connection_profile_url ?? 'https://linkedin.com/in/...'}
                        className="mt-1 block min-h-[36px] w-full rounded border border-white/15 bg-slate-950/75 px-2.5 text-[12px] text-slate-100 placeholder:text-slate-500"
                      />
                    </label>
                    <label className="mt-2 inline-flex min-h-[36px] items-center gap-2 text-[12px] text-slate-200">
                      <input
                        type="checkbox"
                        checked={Boolean(confirmChecks[item.match_id])}
                        onChange={(event) => setConfirmChecks((prev) => ({ ...prev, [item.match_id]: event.target.checked }))}
                      />
                      I confirm this is a known relationship.
                    </label>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] uppercase tracking-[0.08em] text-slate-200">{item.confidence_tier}</span>
                      <button
                        type="button"
                        onClick={() => confirmMatch(item.match_id)}
                        disabled={actingMatchId === item.match_id}
                        className="inline-flex min-h-[36px] items-center rounded border border-emerald-300/30 bg-emerald-500/10 px-2.5 text-[12px] font-semibold text-emerald-200"
                      >
                        Confirm + add contact
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectMatch(item.match_id)}
                        disabled={actingMatchId === item.match_id}
                        className="inline-flex min-h-[36px] items-center rounded border border-rose-300/30 bg-rose-500/10 px-2.5 text-[12px] font-semibold text-rose-200"
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-300">Confirmed relationships</p>
              <button
                type="button"
                onClick={exportConfirmedRelationships}
                disabled={data.confirmed_relationships.length === 0}
                className="inline-flex min-h-[36px] items-center rounded border border-white/15 bg-white/5 px-2.5 text-[12px] font-semibold text-slate-100 disabled:opacity-40"
              >
                Export Sales Navigator CSV
              </button>
            </div>
            {data.confirmed_relationships.length === 0 ? (
              <p className="mt-2 text-[13px] text-slate-300">No confirmed relationships yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {data.confirmed_relationships.map((item) => (
                  <li key={item.match_id} className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2">
                    <p className="text-[13px] font-semibold text-white">{item.candidate_name}</p>
                    <p className="mt-1 text-[12px] text-slate-300">Confirmed through connection {item.connection_name}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
