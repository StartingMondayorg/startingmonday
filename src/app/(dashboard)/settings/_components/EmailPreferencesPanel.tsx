'use client'

import { useState } from 'react'
import { Alert, AlertDescription, Card, Switch } from '@/components/ui'

type PreferenceRowProps = {
  title: string
  description: string
  ariaLabel: string
  endpoint: string
  initialEnabled: boolean
  onMessage: (enabled: boolean) => string
}

function PreferenceRow({ title, description, ariaLabel, endpoint, initialEnabled, onMessage }: PreferenceRowProps) {
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
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.error) throw new Error(data.error ?? 'Could not save your preference.')
      setEnabled(next)
      setMessage(onMessage(next))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your preference.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="max-w-[46ch]">
          <p className="text-[14px] font-semibold text-foreground">{title}</p>
          <p className="text-[13px] text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <span className={`text-[13px] font-semibold ${!enabled ? 'text-foreground' : 'text-muted-foreground'}`}>Off</span>
          <Switch checked={enabled} onCheckedChange={toggle} disabled={saving} aria-label={ariaLabel} />
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
    </div>
  )
}

export function EmailPreferencesPanel({
  initialEnabled,
  initialWeeklySummary = false,
}: {
  initialEnabled: boolean
  initialWeeklySummary?: boolean
}) {
  return (
    <Card variant="glass" className="mb-6 p-5 shadow-xl">
      <h2 className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Email preferences</h2>
      <div className="space-y-5">
        <PreferenceRow
          title="Setup and check-in emails"
          description="At most two emails during your trial: one on day two if you have not added a company yet, and one if you have been away for two weeks. Your search is private. Daily briefings are separate and unaffected."
          ariaLabel="Trial tip emails"
          endpoint="/api/settings/email-nudges"
          initialEnabled={initialEnabled}
          onMessage={(next) => (next ? 'Trial tip emails are on.' : 'Trial tip emails are off. Your daily briefing is unaffected.')}
        />
        <PreferenceRow
          title="Weekly search summary"
          description="One Sunday-night email with your pipeline by stage, the week's new matches, and anything due. Off by default; your daily briefing already covers each day."
          ariaLabel="Weekly search summary email"
          endpoint="/api/settings/weekly-summary"
          initialEnabled={initialWeeklySummary}
          onMessage={(next) => (next ? 'Weekly summary is on. It arrives Sunday night.' : 'Weekly summary is off.')}
        />
      </div>
    </Card>
  )
}