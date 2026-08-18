'use client'

import { useState } from 'react'

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
    <section className="mb-6 rounded-2xl border border-white/15 bg-white/5 p-5 shadow-[0_22px_66px_rgba(15,23,42,0.18)] backdrop-blur-md">
      <h2 className="text-[10px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-3">Email preferences</h2>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="max-w-[46ch]">
          <p className="text-[14px] font-semibold text-white">Trial tips and nudge emails</p>
          <p className="text-[13px] text-slate-300 mt-0.5 leading-relaxed">
            Occasional emails with setup tips during your trial. Your search is private - turn these off anytime with one click.
            Daily briefings are separate and unaffected.
          </p>
        </div>
        <div className="flex gap-2 shrink-0" role="radiogroup" aria-label="Trial tip emails">
          <button
            type="button"
            role="radio"
            aria-checked={!enabled}
            disabled={saving}
            onClick={() => toggle(false)}
            className={[
              'inline-flex min-h-[44px] items-center rounded border px-4 text-[13px] font-semibold transition-colors cursor-pointer disabled:opacity-50',
              !enabled
                ? 'border-orange-300/70 bg-orange-500/20 text-white'
                : 'border-white/15 bg-white/5 text-slate-200 hover:border-white/30',
            ].join(' ')}
          >
            Off
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={enabled}
            disabled={saving}
            onClick={() => toggle(true)}
            className={[
              'inline-flex min-h-[44px] items-center rounded border px-4 text-[13px] font-semibold transition-colors cursor-pointer disabled:opacity-50',
              enabled
                ? 'border-orange-300/70 bg-orange-500/20 text-white'
                : 'border-white/15 bg-white/5 text-slate-200 hover:border-white/30',
            ].join(' ')}
          >
            On
          </button>
        </div>
      </div>
      {message && <p className="mt-3 text-[12px] text-emerald-300">{message}</p>}
      {error && <p role="alert" className="mt-3 text-[12px] text-rose-300">{error}</p>}
    </section>
  )
}
