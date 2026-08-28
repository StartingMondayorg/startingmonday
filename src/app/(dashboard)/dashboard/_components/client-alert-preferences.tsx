'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle, Button, Card, Checkbox, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
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
    return <div className="text-[13px] text-muted-foreground">Loading alert preferences...</div>
  }

  return (
    <Card className="p-5">
      <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-4">
        Alert Preferences
      </p>

      {activeAlerts.length > 0 && (
        <Alert variant="warning" className="mb-4 flex-col items-stretch">
          <AlertTitle className="text-[10px] tracking-[0.1em] uppercase mb-2">
            Active alerts{snapshotLabel ? ` · ${snapshotLabel}` : ''}
          </AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              {activeAlerts.map((alert) => (
                <Alert
                  key={alert.id}
                  variant={alert.severity === 'high' ? 'destructive' : 'warning'}
                  className="px-3 py-2 text-[12px]"
                >
                  <AlertTitle className="capitalize">{alert.title}</AlertTitle>
                  <AlertDescription className="mt-1 text-muted-foreground">{alert.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <Label className="flex items-center justify-between gap-3 text-[13px] font-normal text-muted-foreground">
          <span>Company signal alerts</span>
          <Checkbox
            checked={prefs.alert_on_company_signal}
            onCheckedChange={(checked) => setPrefs((p) => ({ ...p, alert_on_company_signal: checked === true }))}
          />
        </Label>

        <Label className="flex items-center justify-between gap-3 text-[13px] font-normal text-muted-foreground">
          <span>New interview log alerts</span>
          <Checkbox
            checked={prefs.alert_on_new_interview}
            onCheckedChange={(checked) => setPrefs((p) => ({ ...p, alert_on_new_interview: checked === true }))}
          />
        </Label>

        <Label className="flex items-center justify-between gap-3 text-[13px] font-normal text-muted-foreground">
          <span>Client edit activity alerts</span>
          <Checkbox
            checked={prefs.alert_on_client_edit}
            onCheckedChange={(checked) => setPrefs((p) => ({ ...p, alert_on_client_edit: checked === true }))}
          />
        </Label>

        <div className="pt-1">
          <Label htmlFor="alert-frequency" className="text-[12px] font-normal text-muted-foreground">Delivery frequency</Label>
          <Select
            value={prefs.alert_frequency}
            onValueChange={(value) => setPrefs((p) => ({ ...p, alert_frequency: value as AlertPrefs['alert_frequency'] }))}
          >
            <SelectTrigger id="alert-frequency" className="mt-1 w-full text-[13px] text-muted-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="immediate">Immediate</SelectItem>
              <SelectItem value="daily">Daily digest</SelectItem>
              <SelectItem value="weekly">Weekly summary</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Button
          type="button"
          onClick={savePrefs}
          disabled={saving}
          className="text-[13px] font-semibold px-4 py-2"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
        {message && <p className="text-[12px] text-muted-foreground">{message}</p>}
      </div>
    </Card>
  )
}
