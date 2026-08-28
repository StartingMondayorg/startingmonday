'use client'

import { useMemo, useState } from 'react'
import { Alert, AlertDescription, Badge, Button, Card, Checkbox, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
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
  confidence_tier: 'strong_overlap' | 'possible_overlap' | 'rejected'
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
    <Card variant="glass" className="mb-6 p-5 shadow-xl">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-primary">Relationship matching</p>
          <p className="mt-1 text-[13px] text-foreground">Find likely connections from uploaded LinkedIn contacts and candidate records.</p>
        </div>
      </div>

      {!hasUploads && (
        <Alert variant="warning" className="mb-4">
          <AlertDescription>
            Upload a LinkedIn connections CSV above before running company matching.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <div>
          <Label className="text-[12px] text-foreground">Company</Label>
          <Select value={companyId} onValueChange={(value) => setCompanyId(value ?? '')}>
            <SelectTrigger className="mt-1 min-h-[44px] w-full border-border bg-background/70 text-[13px] text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-[12px] text-foreground">LinkedIn upload</Label>
          <Select
            value={hasUploads ? uploadId : undefined}
            onValueChange={(value) => setUploadId(value ?? '')}
            disabled={!hasUploads}
          >
            <SelectTrigger className="mt-1 min-h-[44px] w-full border-border bg-background/70 text-[13px] text-foreground">
              <SelectValue placeholder="No processed uploads yet" />
            </SelectTrigger>
            <SelectContent>
              {uploads.map((upload) => (
                <SelectItem key={upload.id} value={upload.id}>{upload.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          onClick={runMatch}
          disabled={!hasCompany || !hasUploads || loading}
          className="min-h-[44px] px-4 text-[13px]"
        >
          {loading ? 'Matching…' : 'Run match'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {actionMessage && (
        <Alert variant="success" className="mt-3">
          <AlertDescription>{actionMessage}</AlertDescription>
        </Alert>
      )}

      {data && (
        <div className="mt-4 space-y-4">
          <Card variant="glass" className="border-border bg-background/30 p-3">
            <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground">Likely known to you</p>
            {data.likely_known.length === 0 ? (
              <p className="mt-2 text-[13px] text-muted-foreground">No strong-overlap matches yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {data.likely_known.map((item) => (
                  <li key={item.match_id}>
                  <Card variant="glass" className="border-border bg-background/60 px-3 py-2">
                    <p className="text-[13px] font-semibold text-foreground">{item.candidate_name} <span className="font-normal text-muted-foreground">({item.candidate_title ?? 'Role unknown'})</span></p>
                    <p className="mt-1 text-[12px] text-muted-foreground">Matched to your connection: {item.connection_name}{item.connection_company ? ` at ${item.connection_company}` : ''}</p>
                    <Label className="mt-2 block text-[11px] text-muted-foreground">Correct LinkedIn profile URL (optional)</Label>
                    <Input
                      type="url"
                      value={profileCorrections[item.match_id] ?? ''}
                      onChange={(event) => setProfileCorrections((prev) => ({ ...prev, [item.match_id]: event.target.value }))}
                      placeholder={item.connection_profile_url ?? 'https://linkedin.com/in/...'}
                      className="mt-1 min-h-[36px] w-full border-border bg-background/75 text-[12px] text-foreground placeholder:text-muted-foreground"
                    />
                    <label className="mt-2 inline-flex min-h-[36px] items-center gap-2 text-[12px] text-foreground">
                      <Checkbox
                        checked={Boolean(confirmChecks[item.match_id])}
                        onCheckedChange={(checked) => setConfirmChecks((prev) => ({ ...prev, [item.match_id]: checked === true }))}
                      />
                      I confirm this is a known relationship.
                    </label>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="uppercase tracking-[0.08em]">{item.confidence_tier}</Badge>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => confirmMatch(item.match_id)}
                        disabled={actingMatchId === item.match_id}
                        className="min-h-[36px] border-success/30 bg-success/10 text-[12px] font-semibold text-success hover:bg-success/20"
                      >
                        Confirm + add contact
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => rejectMatch(item.match_id)}
                        disabled={actingMatchId === item.match_id}
                        className="min-h-[36px] border-destructive/30 bg-destructive/10 text-[12px] font-semibold text-destructive hover:bg-destructive/20"
                      >
                        Reject
                      </Button>
                    </div>
                  </Card>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card variant="glass" className="border-border bg-background/30 p-3">
            <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground">Needs review</p>
            {data.suggested_matches.length === 0 ? (
              <p className="mt-2 text-[13px] text-muted-foreground">No possible-overlap suggestions yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {data.suggested_matches.map((item) => (
                  <li key={item.match_id}>
                  <Card variant="glass" className="border-border bg-background/60 px-3 py-2">
                    <p className="text-[13px] font-semibold text-foreground">{item.candidate_name}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">Potential overlap with {item.connection_name}</p>
                    <Label className="mt-2 block text-[11px] text-muted-foreground">Correct LinkedIn profile URL (optional)</Label>
                    <Input
                      type="url"
                      value={profileCorrections[item.match_id] ?? ''}
                      onChange={(event) => setProfileCorrections((prev) => ({ ...prev, [item.match_id]: event.target.value }))}
                      placeholder={item.connection_profile_url ?? 'https://linkedin.com/in/...'}
                      className="mt-1 min-h-[36px] w-full border-border bg-background/75 text-[12px] text-foreground placeholder:text-muted-foreground"
                    />
                    <label className="mt-2 inline-flex min-h-[36px] items-center gap-2 text-[12px] text-foreground">
                      <Checkbox
                        checked={Boolean(confirmChecks[item.match_id])}
                        onCheckedChange={(checked) => setConfirmChecks((prev) => ({ ...prev, [item.match_id]: checked === true }))}
                      />
                      I confirm this is a known relationship.
                    </label>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="uppercase tracking-[0.08em]">{item.confidence_tier}</Badge>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => confirmMatch(item.match_id)}
                        disabled={actingMatchId === item.match_id}
                        className="min-h-[36px] border-success/30 bg-success/10 text-[12px] font-semibold text-success hover:bg-success/20"
                      >
                        Confirm + add contact
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => rejectMatch(item.match_id)}
                        disabled={actingMatchId === item.match_id}
                        className="min-h-[36px] border-destructive/30 bg-destructive/10 text-[12px] font-semibold text-destructive hover:bg-destructive/20"
                      >
                        Reject
                      </Button>
                    </div>
                  </Card>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card variant="glass" className="border-border bg-background/30 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground">Confirmed relationships</p>
              <Button
                type="button"
                variant="outline"
                onClick={exportConfirmedRelationships}
                disabled={data.confirmed_relationships.length === 0}
                className="min-h-[36px] border-border bg-muted/40 text-[12px] font-semibold text-foreground"
              >
                Export Sales Navigator CSV
              </Button>
            </div>
            {data.confirmed_relationships.length === 0 ? (
              <p className="mt-2 text-[13px] text-muted-foreground">No confirmed relationships yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {data.confirmed_relationships.map((item) => (
                  <li key={item.match_id}>
                  <Card variant="glass" className="border-border bg-background/60 px-3 py-2">
                    <p className="text-[13px] font-semibold text-foreground">{item.candidate_name}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">Confirmed through connection {item.connection_name}</p>
                  </Card>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </Card>
  )
}
