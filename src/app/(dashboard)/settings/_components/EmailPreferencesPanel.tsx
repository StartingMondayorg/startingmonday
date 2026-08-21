'use client'

import { useState } from 'react'
import { Alert, AlertDescription, Card, Switch } from '@/components/ui'
export function EmailPreferencesPanel({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function toggle(next: boolean) {
    if (saving || next === enabled) return
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/settings/email-nudges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.error) throw new Error(data.error ?? 'Could not save your preference.')
      setEnabled(next)
      setMessage(next ? 'Trial tip emails are on.' : 'Trial tip emails are off. Your daily briefing is unaffected.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your preference.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card variant="glass" className="mb-6 p-5 shadow-xl">
      <h2 className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Email preferences</h2>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="max-w-[46ch]">
          <p className="text-[14px] font-semibold text-foreground">Trial tips and nudge emails</p>
          <p className="text-[13px] text-muted-foreground mt-0.5 leading-relaxed">
            Occasional emails with setup tips during your trial. Your search is private - turn these off anytime with one click.
            Daily briefings are separate and unaffected.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <span className={`text-[13px] font-semibold ${!enabled ? 'text-foreground' : 'text-muted-foreground'}`}>Off</span>
          <Switch
            checked={enabled}
            onCheckedChange={toggle}
            disabled={saving}
            aria-label="Trial tip emails"
          />
          <span className={`text-[13px] font-semibold ${enabled ? 'text-foreground' : 'text-muted-foreground'}`}>On</span>
        </div>
      </div>
      {message && (
        <Alert variant="success" className="mt-3">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </Card>
  )
}
