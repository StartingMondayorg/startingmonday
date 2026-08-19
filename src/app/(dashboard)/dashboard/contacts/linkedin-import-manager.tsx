'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type ImportSession = {
  consentId: string | null
  uploadId: string | null
  fileName: string | null
  method: 'data_export' | 'portability_api'
  rowCount: number
  processedCount: number
  status: 'uploaded' | 'processing' | 'processed' | 'failed' | 'revoked' | 'deleted'
  failureReason: string | null
  uploadedAt: string | null
  consentedAt: string | null
}

type AuditEvent = {
  id: string
  event_type: string
  event_data: Record<string, unknown>
  occurred_at: string
}

const STATUS_VARIANT: Record<ImportSession['status'], 'secondary' | 'warning' | 'success' | 'destructive'> = {
  uploaded: 'secondary',
  processing: 'warning',
  processed: 'success',
  failed: 'destructive',
  revoked: 'secondary',
  deleted: 'secondary',
}

function fmtDate(value: string | null) {
  if (!value) return 'Unknown'
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function LinkedInImportManager({ sessions }: { sessions: ImportSession[] }) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [method, setMethod] = useState<'data_export' | 'portability_api'>('data_export')
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [auditFor, setAuditFor] = useState<string | null>(null)
  const [auditEvents, setAuditEvents] = useState<Record<string, AuditEvent[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('method', method)
      formData.append('purpose', 'company_contact_match')

      const response = await fetch('/api/linkedin-import/consent', {
        method: 'POST',
        body: formData,
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(payload?.error ?? 'Could not import LinkedIn connections.')
        return
      }

      setMessage(`Imported ${payload.connection_count ?? 0} connections. You can now run company matching below.`)
      setFile(null)
      router.refresh()
    } catch {
      setError('Could not import LinkedIn connections.')
    } finally {
      setLoading(false)
    }
  }

  async function toggleAudit(consentId: string) {
    if (auditFor === consentId) {
      setAuditFor(null)
      return
    }

    if (!auditEvents[consentId]) {
      const response = await fetch(`/api/linkedin-import/audit?consent_id=${encodeURIComponent(consentId)}`)
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(payload?.error ?? 'Could not load import audit trail.')
        return
      }
      setAuditEvents((current) => ({ ...current, [consentId]: payload.events ?? [] }))
    }

    setAuditFor(consentId)
  }

  async function deleteSession(session: ImportSession) {
    const key = session.consentId ?? session.uploadId
    if (!key) return
    setDeletingId(key)
    setError(null)
    setMessage(null)

    const qs = new URLSearchParams()
    if (session.consentId) qs.set('consent_id', session.consentId)
    else if (session.uploadId) qs.set('upload_id', session.uploadId)

    try {
      const response = await fetch(`/api/linkedin-import/consent?${qs.toString()}`, { method: 'DELETE' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(payload?.error ?? 'Could not delete import session.')
        return
      }

      setMessage('Import session deleted.')
      router.refresh()
    } catch {
      setError('Could not delete import session.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card variant="glass" className="mb-6 p-5 shadow-[0_22px_66px_rgba(15,23,42,0.18)]">
      <div className="mb-4">
        <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-orange-300">LinkedIn connections</p>
        <h2 className="mt-1 text-[20px] font-bold text-white">Upload and manage your exported network</h2>
        <p className="mt-1 text-[13px] text-slate-200">
          Import the LinkedIn Connections CSV, store it in Supabase, review the audit trail, and use it to find likely warm paths at target companies.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_200px_auto] sm:items-end">
        <label className="text-[12px] text-slate-200">
          Connections CSV
          <Input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="mt-1 block min-h-[44px] w-full rounded border border-white/15 bg-slate-950/70 px-3 py-2 text-[13px] text-slate-100 file:mr-3 file:rounded file:border-0 file:bg-orange-500 file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-slate-950"
          />
        </label>

        <label className="text-[12px] text-slate-200">
          Import method
          <Select value={method} onValueChange={(value) => setMethod(value as 'data_export' | 'portability_api')}>
            <SelectTrigger className="mt-1 block min-h-[44px] w-full rounded border border-white/15 bg-slate-950/70 text-[13px] text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="data_export">LinkedIn data export</SelectItem>
              <SelectItem value="portability_api">LinkedIn portability API</SelectItem>
            </SelectContent>
          </Select>
        </label>

        <Button
          type="button"
          onClick={handleUpload}
          disabled={!file || loading}
          className="min-h-[44px] text-[13px] font-semibold"
        >
          {loading ? 'Importing…' : 'Upload CSV'}
        </Button>
      </div>

      <p className="mt-2 text-[12px] text-slate-400">
        LinkedIn path: Settings &amp; Privacy → Data privacy → Get a copy of your data → Connections.
      </p>

      {error && (
        <Alert variant="destructive" className="mt-3 px-3 py-2">
          <AlertDescription className="text-[12px]">{error}</AlertDescription>
        </Alert>
      )}
      {message && (
        <Alert variant="success" className="mt-3 px-3 py-2">
          <AlertDescription className="text-[12px]">{message}</AlertDescription>
        </Alert>
      )}

      <div className="mt-5 space-y-3">
        <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-300">Recent import sessions</p>
        {sessions.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-slate-950/30 px-4 py-4 text-[13px] text-slate-300">
            No LinkedIn connection uploads yet.
          </div>
        ) : (
          sessions.map((session, index) => {
            const key = session.consentId ?? session.uploadId ?? session.fileName ?? `session-${index}`
            const isDeleting = deletingId === (session.consentId ?? session.uploadId)
            const canAudit = Boolean(session.consentId)
            return (
              <Card key={key} variant="glass" className="rounded-xl border-white/10 bg-slate-950/30 px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-semibold text-white">{session.fileName ?? 'Legacy import session'}</p>
                      <Badge variant={STATUS_VARIANT[session.status]} className="uppercase">
                        {session.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[12px] text-slate-300">
                      {session.processedCount || session.rowCount} connection{(session.processedCount || session.rowCount) === 1 ? '' : 's'} · {session.method === 'portability_api' ? 'Portability API' : 'Data export'} · {fmtDate(session.uploadedAt ?? session.consentedAt)}
                    </p>
                    {session.failureReason && (
                      <p className="mt-1 text-[12px] text-rose-200">{session.failureReason}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {canAudit && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => toggleAudit(session.consentId!)}
                        className="min-h-[36px] border-white/15 bg-white/5 text-[12px] font-semibold text-slate-100 hover:border-white/30 hover:bg-white/10"
                      >
                        {auditFor === session.consentId ? 'Hide audit' : 'View audit'}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => deleteSession(session)}
                      disabled={isDeleting}
                      className="min-h-[36px] text-[12px] font-semibold"
                    >
                      {isDeleting ? 'Deleting…' : 'Delete data'}
                    </Button>
                  </div>
                </div>

                {auditFor === session.consentId && canAudit && auditEvents[session.consentId!] && (
                  <div className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-3">
                    <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-300 mb-2">Audit trail</p>
                    <ul className="space-y-2">
                      {auditEvents[session.consentId!].map((event) => (
                        <li key={event.id} className="text-[12px] text-slate-300">
                          <span className="font-semibold text-white">{event.event_type.replaceAll('_', ' ')}</span>
                          <span className="text-slate-400"> · {fmtDate(event.occurred_at)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>
    </Card>
  )
}
