'use client'

import { useEffect, useMemo, useState } from 'react'
import { Alert, AlertDescription, Button, Card, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
type MarketingMotion = 'direct_paid_sprint' | 'partner_pilot' | 'other'
type PartnerCommercialEvent = 'pilot_fee_collected' | 'expansion_proposal_sent' | 'expansion_accepted' | 'expansion_rejected'

type LedgersResponse = {
  ok: boolean
  lookback_days: number
  marketing_spend_entries: Array<{
    id: string
    motion: MarketingMotion
    channel: string | null
    amount_usd: number
    effective_at: string
    notes: string | null
    metadata: Record<string, unknown>
    created_at: string
  }>
  partner_commercial_events: Array<{
    id: string
    partner_id: string
    event_type: PartnerCommercialEvent
    amount_usd: number | null
    effective_at: string
    metadata: Record<string, unknown>
    created_at: string
  }>
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

function toIsoOrUndefined(value: string): string | undefined {
  if (!value) return undefined
  const normalized = new Date(value)
  if (Number.isNaN(normalized.getTime())) return undefined
  return normalized.toISOString()
}

function money(value: number | null): string {
  if (value === null) return '--'
  return `$${value.toFixed(2)}`
}

export default function WedgeEconomicsClient() {
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [lookbackDays, setLookbackDays] = useState(30)
  const [payload, setPayload] = useState<LedgersResponse | null>(null)

  const [marketingMotion, setMarketingMotion] = useState<MarketingMotion>('direct_paid_sprint')
  const [marketingChannel, setMarketingChannel] = useState('')
  const [marketingAmount, setMarketingAmount] = useState('')
  const [marketingEffectiveAt, setMarketingEffectiveAt] = useState('')
  const [marketingNotes, setMarketingNotes] = useState('')

  const [partnerId, setPartnerId] = useState('')
  const [partnerEventType, setPartnerEventType] = useState<PartnerCommercialEvent>('pilot_fee_collected')
  const [partnerAmount, setPartnerAmount] = useState('')
  const [partnerEffectiveAt, setPartnerEffectiveAt] = useState('')

  const [submitState, setSubmitState] = useState<'idle' | 'saving'>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)

  const marketingTotal = useMemo(() => {
    return (payload?.marketing_spend_entries ?? []).reduce((sum, row) => sum + Number(row.amount_usd ?? 0), 0)
  }, [payload])

  const partnerFeesTotal = useMemo(() => {
    return (payload?.partner_commercial_events ?? [])
      .filter((row) => row.event_type === 'pilot_fee_collected')
      .reduce((sum, row) => sum + Number(row.amount_usd ?? 0), 0)
  }, [payload])

  async function loadData(currentLookbackDays: number) {
    setLoadState('loading')
    setLoadError(null)

    try {
      const response = await fetch(`/api/admin/automation/reporting/wedge-economics-ledgers?lookbackDays=${currentLookbackDays}`, { cache: 'no-store' })
      const json = await response.json() as LedgersResponse | { error?: string }

      if (!response.ok) {
        throw new Error((json as { error?: string }).error ?? 'Failed to load wedge economics ledgers.')
      }

      setPayload(json as LedgersResponse)
      setLoadState('ready')
    } catch (error) {
      setLoadState('error')
      setLoadError(error instanceof Error ? error.message : 'Failed to load wedge economics ledgers.')
    }
  }

  useEffect(() => {
    void loadData(lookbackDays)
  }, [lookbackDays])

  async function submitMarketingEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitState('saving')
    setSubmitError(null)
    setSubmitMessage(null)

    const amount = Number(marketingAmount)
    if (!Number.isFinite(amount) || amount < 0) {
      setSubmitState('idle')
      setSubmitError('Marketing amount must be a valid non-negative number.')
      return
    }

    try {
      const response = await fetch('/api/admin/automation/reporting/wedge-economics-ledgers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: [
            {
              ledger: 'marketing_spend',
              motion: marketingMotion,
              channel: marketingChannel.trim() || undefined,
              amount_usd: amount,
              effective_at: toIsoOrUndefined(marketingEffectiveAt),
              notes: marketingNotes.trim() || undefined,
            },
          ],
        }),
      })

      const json = await response.json() as { error?: string }
      if (!response.ok) {
        throw new Error(json.error ?? 'Failed to write marketing ledger row.')
      }

      setMarketingAmount('')
      setMarketingChannel('')
      setMarketingEffectiveAt('')
      setMarketingNotes('')
      setSubmitMessage('Marketing spend entry saved.')
      await loadData(lookbackDays)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to write marketing ledger row.')
    } finally {
      setSubmitState('idle')
    }
  }

  async function submitPartnerEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitState('saving')
    setSubmitError(null)
    setSubmitMessage(null)

    const trimmedPartnerId = partnerId.trim()
    if (!trimmedPartnerId) {
      setSubmitState('idle')
      setSubmitError('Partner ID is required for partner commercial events.')
      return
    }

    const parsedAmount = partnerAmount.trim() === '' ? null : Number(partnerAmount)
    if (parsedAmount !== null && (!Number.isFinite(parsedAmount) || parsedAmount < 0)) {
      setSubmitState('idle')
      setSubmitError('Partner amount must be empty or a valid non-negative number.')
      return
    }

    try {
      const response = await fetch('/api/admin/automation/reporting/wedge-economics-ledgers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: [
            {
              ledger: 'partner_commercial',
              partner_id: trimmedPartnerId,
              event_type: partnerEventType,
              amount_usd: parsedAmount,
              effective_at: toIsoOrUndefined(partnerEffectiveAt),
            },
          ],
        }),
      })

      const json = await response.json() as { error?: string }
      if (!response.ok) {
        throw new Error(json.error ?? 'Failed to write partner commercial event.')
      }

      setPartnerAmount('')
      setPartnerEffectiveAt('')
      setSubmitMessage('Partner commercial event saved.')
      await loadData(lookbackDays)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to write partner commercial event.')
    } finally {
      setSubmitState('idle')
    }
  }

  return (
    <>
      <Card variant="glass" className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-primary">Ledger controls</p>
          <Label className="text-[12px] text-muted-foreground">
            Lookback days
            <Input
              type="number"
              min={7}
              max={120}
              value={lookbackDays}
              onChange={(event) => setLookbackDays(Math.max(7, Math.min(120, Number(event.target.value) || 30)))}
              className="ml-2 w-20"
            />
          </Label>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card variant="glass" className="p-3 border-border bg-background/40">
            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Marketing rows</p>
            <p className="mt-1 text-[18px] font-semibold text-foreground">{payload?.marketing_spend_entries.length ?? 0}</p>
          </Card>
          <Card variant="glass" className="p-3 border-border bg-background/40">
            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Marketing total</p>
            <p className="mt-1 text-[18px] font-semibold text-foreground">{money(marketingTotal)}</p>
          </Card>
          <Card variant="glass" className="p-3 border-border bg-background/40">
            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Partner events</p>
            <p className="mt-1 text-[18px] font-semibold text-foreground">{payload?.partner_commercial_events.length ?? 0}</p>
          </Card>
          <Card variant="glass" className="p-3 border-border bg-background/40">
            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Pilot fees</p>
            <p className="mt-1 text-[18px] font-semibold text-foreground">{money(partnerFeesTotal)}</p>
          </Card>
        </div>

        {submitError ? (
          <Alert variant="destructive" className="mt-3">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}
        {submitMessage ? (
          <Alert variant="success" className="mt-3">
            <AlertDescription>{submitMessage}</AlertDescription>
          </Alert>
        ) : null}
        {loadState === 'error' && loadError ? (
          <Alert variant="destructive" className="mt-3">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}
      </Card>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <form onSubmit={submitMarketingEntry}>
        <Card variant="glass" className="p-5">
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-primary">Add marketing spend</p>
          <div className="mt-3 space-y-3 text-[13px] text-foreground">
            <div>
              <Label className="block">Motion</Label>
              <Select value={marketingMotion} onValueChange={(value) => setMarketingMotion(value as MarketingMotion)}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct_paid_sprint">direct_paid_sprint</SelectItem>
                  <SelectItem value="partner_pilot">partner_pilot</SelectItem>
                  <SelectItem value="other">other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block">Channel</Label>
              <Input value={marketingChannel} onChange={(event) => setMarketingChannel(event.target.value)} placeholder="paid_social" className="mt-1 w-full" />
            </div>
            <div>
              <Label className="block">Amount USD</Label>
              <Input value={marketingAmount} onChange={(event) => setMarketingAmount(event.target.value)} type="number" min={0} step="0.01" required className="mt-1 w-full" />
            </div>
            <div>
              <Label className="block">Effective at</Label>
              <Input value={marketingEffectiveAt} onChange={(event) => setMarketingEffectiveAt(event.target.value)} type="datetime-local" className="mt-1 w-full" />
            </div>
            <div>
              <Label className="block">Notes</Label>
              <Input value={marketingNotes} onChange={(event) => setMarketingNotes(event.target.value)} placeholder="optional context" className="mt-1 w-full" />
            </div>
          </div>
          <Button disabled={submitState === 'saving'} type="submit" variant="outline" className="mt-4">
            {submitState === 'saving' ? 'Saving...' : 'Save marketing row'}
          </Button>
        </Card>
        </form>

        <form onSubmit={submitPartnerEvent}>
        <Card variant="glass" className="p-5">
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-primary">Add partner commercial event</p>
          <div className="mt-3 space-y-3 text-[13px] text-foreground">
            <div>
              <Label className="block">Partner ID</Label>
              <Input value={partnerId} onChange={(event) => setPartnerId(event.target.value)} placeholder="UUID" required className="mt-1 w-full" />
            </div>
            <div>
              <Label className="block">Event type</Label>
              <Select value={partnerEventType} onValueChange={(value) => setPartnerEventType(value as PartnerCommercialEvent)}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pilot_fee_collected">pilot_fee_collected</SelectItem>
                  <SelectItem value="expansion_proposal_sent">expansion_proposal_sent</SelectItem>
                  <SelectItem value="expansion_accepted">expansion_accepted</SelectItem>
                  <SelectItem value="expansion_rejected">expansion_rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block">Amount USD (optional)</Label>
              <Input value={partnerAmount} onChange={(event) => setPartnerAmount(event.target.value)} type="number" min={0} step="0.01" className="mt-1 w-full" />
            </div>
            <div>
              <Label className="block">Effective at</Label>
              <Input value={partnerEffectiveAt} onChange={(event) => setPartnerEffectiveAt(event.target.value)} type="datetime-local" className="mt-1 w-full" />
            </div>
          </div>
          <Button disabled={submitState === 'saving'} type="submit" variant="outline" className="mt-4">
            {submitState === 'saving' ? 'Saving...' : 'Save partner event'}
          </Button>
        </Card>
        </form>
      </section>

      <Card variant="glass" className="mt-5 overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Recent marketing spend rows</p>
          <span className="text-[12px] text-muted-foreground">{loadState === 'loading' ? 'Loading...' : `Rows: ${payload?.marketing_spend_entries.length ?? 0}`}</span>
        </div>
        <div className="overflow-x-auto">
          <Table className="text-[12px] text-foreground">
            <TableHeader>
              <TableRow className="text-muted-foreground">
                <TableHead className="px-5 pr-4">Effective</TableHead>
                <TableHead className="pr-4">Motion</TableHead>
                <TableHead className="pr-4">Channel</TableHead>
                <TableHead className="pr-4">Amount</TableHead>
                <TableHead className="pr-4">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(payload?.marketing_spend_entries ?? []).map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-5 pr-4 font-mono text-[11px] text-muted-foreground">{new Date(row.effective_at).toISOString()}</TableCell>
                  <TableCell className="pr-4">{row.motion}</TableCell>
                  <TableCell className="pr-4">{row.channel ?? '--'}</TableCell>
                  <TableCell className="pr-4">{money(row.amount_usd)}</TableCell>
                  <TableCell className="pr-4 max-w-[260px] truncate" title={row.notes ?? '--'}>{row.notes ?? '--'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card variant="glass" className="mt-5 overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Recent partner commercial events</p>
          <span className="text-[12px] text-muted-foreground">{loadState === 'loading' ? 'Loading...' : `Rows: ${payload?.partner_commercial_events.length ?? 0}`}</span>
        </div>
        <div className="overflow-x-auto">
          <Table className="text-[12px] text-foreground">
            <TableHeader>
              <TableRow className="text-muted-foreground">
                <TableHead className="px-5 pr-4">Effective</TableHead>
                <TableHead className="pr-4">Partner</TableHead>
                <TableHead className="pr-4">Event</TableHead>
                <TableHead className="pr-4">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(payload?.partner_commercial_events ?? []).map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-5 pr-4 font-mono text-[11px] text-muted-foreground">{new Date(row.effective_at).toISOString()}</TableCell>
                  <TableCell className="pr-4 font-mono text-[11px] text-muted-foreground">{row.partner_id}</TableCell>
                  <TableCell className="pr-4">{row.event_type}</TableCell>
                  <TableCell className="pr-4">{money(row.amount_usd)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  )
}
