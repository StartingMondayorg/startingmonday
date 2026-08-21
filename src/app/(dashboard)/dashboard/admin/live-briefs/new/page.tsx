'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

const initialForm = {
  prospect_name: '',
  prospect_email: '',
  hubspot_contact_id: '',
  hubspot_deal_id: '',
  linkedin_url: '',
  source_text_encrypted_ref: '',
  consent_attested_at: new Date().toISOString().slice(0, 16),
  consent_source: '',
  request_source: 'inbound_email',
  location_preference: '',
  target_role_lane: '',
  operator_notes: '',
}

export default function NewLiveBriefPage() {
  const router = useRouter()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function update(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/admin/live-briefs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await response.json() as { id?: string; error?: string }
      if (!response.ok || !result.id) {
        setError(result.error ?? 'Unable to create live brief request')
        return
      }
      router.push(`/dashboard/admin/live-briefs/${result.id}`)
    } catch {
      setError('Unable to reach the live brief service')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="bg-primary">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:text-[14px]">
            <span className="text-primary-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <Link href="/dashboard/admin/live-briefs" className="text-[12px] font-semibold text-muted-foreground">Live briefs</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link href="/dashboard/admin/live-briefs" className="text-[12px] font-semibold text-muted-foreground hover:text-foreground">← Back to queue</Link>
        <div className="mb-6 mt-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Operator intake</p>
          <h1 className="mt-1 text-[26px] font-bold text-foreground">New live brief request</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Create the private request record before profile review.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <section className="rounded border border-border bg-card p-5 shadow-sm">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Prospect</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Name" required value={form.prospect_name} onChange={(value) => update('prospect_name', value)} />
              <Field label="Email" required type="email" value={form.prospect_email} onChange={(value) => update('prospect_email', value)} />
              <Field label="HubSpot contact ID" value={form.hubspot_contact_id} onChange={(value) => update('hubspot_contact_id', value)} />
              <Field label="HubSpot deal ID" value={form.hubspot_deal_id} onChange={(value) => update('hubspot_deal_id', value)} />
              <Field label="LinkedIn URL" value={form.linkedin_url} onChange={(value) => update('linkedin_url', value)} />
              <Field label="Location preference" value={form.location_preference} onChange={(value) => update('location_preference', value)} />
              <Field label="Target role lane" value={form.target_role_lane} onChange={(value) => update('target_role_lane', value)} />
              <label className="block text-[12px] font-semibold text-muted-foreground">Request source<select value={form.request_source} onChange={(event) => update('request_source', event.target.value)} className="mt-1.5 block h-10 w-full rounded border border-border bg-card px-3 text-[13px] font-normal text-foreground outline-none focus:border-primary/30"><option value="inbound_email">Inbound email</option><option value="call">Call</option><option value="referral">Referral</option><option value="other">Other</option></select></label>
            </div>
          </section>

          <section className="rounded border border-border bg-card p-5 shadow-sm">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Consent and source</h2>
            <div className="mt-4 space-y-4">
              <Field label="Encrypted source record reference" required value={form.source_text_encrypted_ref} onChange={(value) => update('source_text_encrypted_ref', value)} />
              <Field label="How consent was given" required value={form.consent_source} onChange={(value) => update('consent_source', value)} />
              <Field label="Consent attested at" required type="datetime-local" value={form.consent_attested_at} onChange={(value) => update('consent_attested_at', value)} />
              <label className="block text-[12px] font-semibold text-muted-foreground">Operator notes<textarea value={form.operator_notes} onChange={(event) => update('operator_notes', event.target.value)} rows={4} className="mt-1.5 block w-full rounded border border-border px-3 py-2 text-[13px] font-normal text-foreground outline-none focus:border-primary/30" /></label>
            </div>
          </section>

          {error && <p role="alert" className="rounded border border-destructive/30 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">{error}</p>}
          <div className="flex justify-end gap-3">
            <Link href="/dashboard/admin/live-briefs" className="rounded border border-border bg-card px-4 py-2 text-[13px] font-semibold text-muted-foreground hover:bg-muted">Cancel</Link>
            <button type="submit" disabled={saving} className="rounded bg-primary px-5 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Creating…' : 'Create request'}</button>
          </div>
        </form>
      </main>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="block text-[12px] font-semibold text-muted-foreground">{label}{required && <span className="ml-1 text-primary">*</span>}<input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 block h-10 w-full rounded border border-border px-3 text-[13px] font-normal text-foreground outline-none focus:border-primary/30" /></label>
}