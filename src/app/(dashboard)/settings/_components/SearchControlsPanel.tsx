'use client'

import { useMemo, useState } from 'react'
import { TrackLink } from '@/app/components/TrackLink'
import { Alert, AlertDescription, Button, Card, Input, Label, RadioGroup, RadioGroupItem, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
type BriefingFrequency = 'daily' | 'weekly'

export function SearchControlsPanel({
  initialFrequency,
  initialBriefingTime,
  isPaused,
}: {
  initialFrequency: BriefingFrequency
  initialBriefingTime: string | null
  isPaused: boolean
}) {
  const [paused, setPaused] = useState(isPaused)
  const [days, setDays] = useState(14)
  const [pausing, setPausing] = useState(false)
  const [resuming, setResuming] = useState(false)
  const [pauseMessage, setPauseMessage] = useState<string | null>(null)
  const [pauseError, setPauseError] = useState<string | null>(null)

  const [frequency, setFrequency] = useState<BriefingFrequency>(initialFrequency)
  const [briefingTime, setBriefingTime] = useState(initialBriefingTime?.slice(0, 5) ?? '07:00')
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [prefsMessage, setPrefsMessage] = useState<string | null>(null)
  const [prefsError, setPrefsError] = useState<string | null>(null)

  const validTime = /^([01]\d|2[0-3]):([0-5]\d)$/.test(briefingTime)
  

  const isDirty = useMemo(() => {
    const sameFreq = frequency === initialFrequency
    const sameTime = (initialBriefingTime?.slice(0, 5) ?? '07:00') === briefingTime
    return !(sameFreq && sameTime)
  }, [frequency, initialFrequency, briefingTime, initialBriefingTime])

  const canSavePrefs = savingPrefs || !isDirty || (frequency === 'daily' && !validTime)

  async function handlePause() {
    setPausing(true)
    setPauseMessage(null)
    setPauseError(null)
    try {
      const res = await fetch('/api/billing/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.error) throw new Error(data.error ?? 'Could not pause search right now.')
      setPauseMessage(`Search paused for ${days} days. Major alerts and digest stay on.`)
      setPaused(true)
    } catch (err) {
      setPauseError(err instanceof Error ? err.message : 'Could not pause search right now.')
    } finally {
      setPausing(false)
    }
  }

  async function handleResume() {
    setResuming(true)
    setPauseMessage(null)
    setPauseError(null)
    try {
      const res = await fetch('/api/billing/resume', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.error) throw new Error(data.error ?? 'Could not resume search right now.')
      setPauseMessage('Search resumed. Daily workflows are active again.')
      setPaused(false)
    } catch (err) {
      setPauseError(err instanceof Error ? err.message : 'Could not resume search right now.')
    } finally {
      setResuming(false)
    }
  }

  async function saveBriefingPrefs() {
    if (frequency === 'daily' && !validTime) {
      setPrefsError('Use a valid time in HH:MM format for daily briefing.')
      return
    }

    setSavingPrefs(true)
    setPrefsMessage(null)
    setPrefsError(null)
    try {
      const res = await fetch('/api/preferences/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefingFrequency: frequency, briefingTime }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.error) throw new Error(data.error ?? 'Could not save preferences.')
      setPrefsMessage('Briefing preferences saved.')
    } catch (err) {
      setPrefsError(err instanceof Error ? err.message : 'Could not save preferences.')
    } finally {
      setSavingPrefs(false)
    }
  }

  return (
    <Card variant="glass" className="p-5 mb-6 sm:mb-8">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Search controls</p>
        <TrackLink
          href="/settings/billing"
          event="search_controls_clicked"
          properties={{ target: 'billing' }}
          className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Billing &amp; settings →
        </TrackLink>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card variant="glass" className="p-4 bg-transparent">
          <p className="text-[12px] font-semibold text-foreground mb-2">Pause search</p>
          <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">
            Keep major alerts and low-frequency digest active while you take a break.
          </p>
          {!paused ? (
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={String(days)}
                onValueChange={(value) => setDays(Number(value))}
                disabled={pausing}
              >
                <SelectTrigger aria-label="Pause duration" className="bg-card text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={handlePause}
                disabled={pausing}
                variant="outline"
                size="sm"
              >
                {pausing ? 'Pausing...' : 'Pause search'}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleResume}
              disabled={resuming}
              size="sm"
            >
              {resuming ? 'Resuming...' : 'Resume search'}
            </Button>
          )}
          {pauseMessage && (
            <Alert variant="success" className="mt-2">
              <AlertDescription>{pauseMessage}</AlertDescription>
            </Alert>
          )}
          {pauseError && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription className="flex flex-col items-start gap-1.5">
                {pauseError}
                <Button
                  type="button"
                  onClick={paused ? handleResume : handlePause}
                  disabled={pausing || resuming}
                  variant="outline"
                  size="xs"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </Card>

        <Card variant="glass" className="p-4 bg-transparent">
          <p className="text-[12px] font-semibold text-foreground mb-2">Digest preferences</p>
          <RadioGroup
            value={frequency}
            onValueChange={(value) => setFrequency(value as BriefingFrequency)}
            className="flex items-center gap-4 mb-3"
          >
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="daily" id="frequency-daily" />
              <Label htmlFor="frequency-daily" className="text-[12px] text-muted-foreground font-normal">
                Daily briefing
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="weekly" id="frequency-weekly" />
              <Label htmlFor="frequency-weekly" className="text-[12px] text-muted-foreground font-normal">
                Weekly digest
              </Label>
            </div>
          </RadioGroup>
          <div className="flex items-center gap-2 mb-3">
            <Label htmlFor="briefing-time" className="text-[12px] text-muted-foreground font-normal">Time:</Label>
            <Input
              id="briefing-time"
              type="time"
              value={briefingTime}
              onChange={e => setBriefingTime(e.target.value)}
              disabled={frequency === 'weekly'}
              className="w-auto bg-card text-foreground"
            />
          </div>
          <Button
            type="button"
            onClick={saveBriefingPrefs}
            disabled={canSavePrefs}
            variant="outline"
            size="sm"
          >
            {savingPrefs ? 'Saving...' : 'Save preferences'}
          </Button>
          {frequency === 'daily' && !validTime && (
            <Alert variant="warning" className="mt-2">
              <AlertDescription>Enter a valid daily time before saving.</AlertDescription>
            </Alert>
          )}
          {prefsMessage && (
            <Alert variant="success" className="mt-2">
              <AlertDescription>{prefsMessage}</AlertDescription>
            </Alert>
          )}
          {prefsError && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription className="flex flex-col items-start gap-1.5">
                {prefsError}
                <Button
                  type="button"
                  onClick={saveBriefingPrefs}
                  disabled={savingPrefs}
                  variant="outline"
                  size="xs"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  Retry save
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </Card>
      </div>
    </Card>
  )
}

