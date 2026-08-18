'use client'

import { useEffect, useState } from 'react'

type AlertPrefs = {
  alert_on_company_signal: boolean
  alert_on_new_interview: boolean
  alert_on_client_edit: boolean
  alert_frequency: 'immediate' | 'daily' | 'weekly'
}

const DEFAULT_PREFS: AlertPrefs = {
  alert_on_company_signal: true,
  alert_on_new_interview: true,
  alert_on_client_edit: false,
  alert_frequency: 'daily',
}

export function ClientAlertPreferences({ clientId }: { clientId: string }) {
  const [prefs, setPrefs] = useState<AlertPrefs>(DEFAULT_PREFS)
  const [activeAlerts, setActiveAlerts] = useState<Array<{ id: string; lane: string; severity: string; title: string; message: string }>>([])
  const [snapshotLabel, setSnapshotLabel] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadPrefs() {
      try {
        const res = await fetch(`/api/coach/client/${clientId}/alerts`)
        if (!res.ok) throw new Error('Could not load alert preferences')
        const json = await res.json()
        setPrefs(json.data ?? DEFAULT_PREFS)
        setActiveAlerts(Array.isArray(json.active_alerts) ? json.active_alerts : [])
        setSnapshotLabel(typeof json.snapshot?.baseline_label === 'string' ? json.snapshot.baseline_label : null)
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Could not load alert preferences')
      } finally {
        setLoading(false)
      }
    }

    loadPrefs()
  }, [clientId])

  async function savePrefs() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/coach/client/${clientId}/alerts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
      if (!res.ok) throw new Error('Could not save alert preferences')
      setMessage('Alert preferences saved.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save alert preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-[13px] text-slate-500">Loading alert preferences...</div>
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-500 mb-4">
        Alert Preferences
      </p>

      {activeAlerts.length > 0 && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3">
          <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-amber-700 mb-2">
            Active alerts{snapshotLabel ? ` · ${snapshotLabel}` : ''}
          </p>
          <div className="space-y-2">
            {activeAlerts.map((alert) => (
              <div key={alert.id} className={`rounded border px-3 py-2 text-[12px] ${alert.severity === 'high' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-white text-amber-900'}`}>
                <div className="font-semibold capitalize">{alert.title}</div>
                <div className="mt-1 text-slate-600">{alert.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <label className="flex items-center justify-between gap-3 text-[13px] text-slate-700">
          <span>Company signal alerts</span>
          <input
            type="checkbox"
            checked={prefs.alert_on_company_signal}
            onChange={(e) => setPrefs((p) => ({ ...p, alert_on_company_signal: e.target.checked }))}
          />
        </label>

        <label className="flex items-center justify-between gap-3 text-[13px] text-slate-700">
          <span>New interview log alerts</span>
          <input
            type="checkbox"
            checked={prefs.alert_on_new_interview}
            onChange={(e) => setPrefs((p) => ({ ...p, alert_on_new_interview: e.target.checked }))}
          />
        </label>

        <label className="flex items-center justify-between gap-3 text-[13px] text-slate-700">
          <span>Client edit activity alerts</span>
          <input
            type="checkbox"
            checked={prefs.alert_on_client_edit}
            onChange={(e) => setPrefs((p) => ({ ...p, alert_on_client_edit: e.target.checked }))}
          />
        </label>

        <div className="pt-1">
          <label htmlFor="alert-frequency" className="text-[12px] text-slate-500">Delivery frequency</label>
          <select
            id="alert-frequency"
            value={prefs.alert_frequency}
            onChange={(e) => setPrefs((p) => ({ ...p, alert_frequency: e.target.value as AlertPrefs['alert_frequency'] }))}
            className="mt-1 w-full border border-slate-200 rounded px-3 py-2 text-[13px] text-slate-700"
          >
            <option value="immediate">Immediate</option>
            <option value="daily">Daily digest</option>
            <option value="weekly">Weekly summary</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={savePrefs}
          disabled={saving}
          className="bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white text-[13px] font-semibold px-4 py-2 rounded"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
        {message && <p className="text-[12px] text-slate-500">{message}</p>}
      </div>
    </div>
  )
}
