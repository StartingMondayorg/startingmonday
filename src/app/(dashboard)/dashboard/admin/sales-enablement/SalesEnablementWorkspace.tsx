'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { DEFAULT_STATE, LOCAL_FALLBACK_KEY, clampScore, weightedScore, type DeliveryModel, type OptionStatus, type VendorOption, type WorkspaceState, type SaveState } from './sales-enablement-data'

function scoreBadgeVariant(score: number): 'success' | 'warning' | 'secondary' {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'secondary'
}

export function SalesEnablementWorkspace() {
  const [state, setState] = useState<WorkspaceState>(DEFAULT_STATE)
  const [loaded, setLoaded] = useState(false)
  const [canEdit, setCanEdit] = useState(true)
  const [saveState, setSaveState] = useState<SaveState>('loading')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadFromServer() {
      try {
        const res = await fetch('/api/admin/sales-enablement/workspace', { cache: 'no-store' })
        if (!res.ok) throw new Error(`Failed to load workspace (${res.status})`)
        const payload = await res.json() as { workspace?: unknown; role?: string }
        if (!isMounted) return

        const role = payload.role === 'viewer' ? 'viewer' : 'editor'
        const editable = role !== 'viewer'
        setCanEdit(editable)
        setSaveState(editable ? 'saved' : 'read-only')

        if (payload.workspace && typeof payload.workspace === 'object') {
          const incoming = payload.workspace as Partial<WorkspaceState>
          setState({
            ...DEFAULT_STATE,
            ...incoming,
            options: Array.isArray(incoming.options) ? incoming.options : DEFAULT_STATE.options,
          })
        }
      } catch {
        if (!isMounted) return
        try {
          const cached = localStorage.getItem(LOCAL_FALLBACK_KEY)
          if (cached) {
            const parsed = JSON.parse(cached) as Partial<WorkspaceState>
            setState({
              ...DEFAULT_STATE,
              ...parsed,
              options: Array.isArray(parsed.options) ? parsed.options : DEFAULT_STATE.options,
            })
          }
        } catch {
          // Keep defaults if fallback cache is unavailable.
        }
        setCanEdit(true)
        setSaveState('error')
      } finally {
        if (isMounted) setLoaded(true)
      }
    }

    void loadFromServer()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!loaded || !canEdit) return

    try {
      localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(state))
    } catch {
      // Ignore local cache failures.
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveState('saving')

    saveTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/admin/sales-enablement/workspace', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspace: state }),
        })
        setSaveState(res.ok ? 'saved' : 'error')
      } catch {
        setSaveState('error')
      }
    }, 700)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [state, loaded, canEdit])

  const ranked = useMemo(() => {
    return [...state.options]
      .map((option) => ({ option, score: weightedScore(option) }))
      .sort((a, b) => b.score - a.score)
  }, [state.options])

  function updateOption(id: string, patch: Partial<VendorOption>) {
    setState((prev) => ({
      ...prev,
      options: prev.options.map((option) => (option.id === id ? { ...option, ...patch } : option)),
    }))
  }

  function resetWorkspace() {
    if (!canEdit) return
    setState(DEFAULT_STATE)
    try {
      localStorage.removeItem(LOCAL_FALLBACK_KEY)
    } catch {
      // Ignore local cache failures.
    }
  }

  const statusLabel =
    saveState === 'loading' ? 'Loading shared workspace...' :
    saveState === 'saving' ? 'Saving...' :
    saveState === 'saved' ? 'Saved to team workspace' :
    saveState === 'read-only' ? 'Read-only access (viewer role)' :
    'Save failed. Check auth or retry.'

  return (
    <div className="space-y-6">
      <Card variant="glass" className="p-5">
        <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-3">Decision Inputs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
          <div className="flex flex-col gap-1.5">
            <Label className="block text-slate-300">Primary objective</Label>
            <Input
              value={state.objective}
              onChange={(event) => setState((prev) => ({ ...prev, objective: event.target.value }))}
              disabled={!canEdit}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="block text-slate-300">Budget ceiling (monthly)</Label>
            <Input
              type="number"
              min={0}
              value={state.budgetCeiling}
              onChange={(event) => setState((prev) => ({ ...prev, budgetCeiling: Number(event.target.value || 0) }))}
              disabled={!canEdit}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="block text-slate-300">Execution mode</Label>
            <Select
              value={state.primaryModel}
              onValueChange={(value) => setState((prev) => ({ ...prev, primaryModel: value as WorkspaceState['primaryModel'] }))}
              disabled={!canEdit}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="done-for-you">Done-for-you</SelectItem>
                <SelectItem value="done-with-you">Done-with-you</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="block text-slate-300">Checkpoint window</Label>
            <Select
              value={state.checkpointWindow}
              onValueChange={(value) => setState((prev) => ({ ...prev, checkpointWindow: value as WorkspaceState['checkpointWindow'] }))}
              disabled={!canEdit}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day-14">Day 14</SelectItem>
                <SelectItem value="day-30">Day 30</SelectItem>
                <SelectItem value="both">Day 14 and Day 30</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-1.5 text-[13px]">
          <Label className="block text-slate-300">Qualified meeting definition</Label>
          <Textarea
            value={state.qualifiedMeetingDefinition}
            onChange={(event) => setState((prev) => ({ ...prev, qualifiedMeetingDefinition: event.target.value }))}
            disabled={!canEdit}
            className="w-full min-h-[88px]"
          />
        </div>
      </Card>

      <Card variant="glass" className="overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
          <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400">Option Scorecard</h2>
          <p className="text-[12px] text-slate-300">Weighted score = Fit 40% + Commercial 35% + Execution 25%</p>
        </div>

        <Table className="text-[12px] min-w-[1180px]">
          <TableHeader>
            <TableRow className="bg-slate-950/60 border-white/10 hover:bg-slate-950/60">
              <TableHead className="px-4 py-2.5 font-semibold text-slate-400">Option</TableHead>
              <TableHead className="px-4 py-2.5 font-semibold text-slate-400">Model</TableHead>
              <TableHead className="px-4 py-2.5 font-semibold text-slate-400">Cost</TableHead>
              <TableHead className="px-4 py-2.5 font-semibold text-slate-400">Status</TableHead>
              <TableHead className="px-4 py-2.5 font-semibold text-slate-400">Fit</TableHead>
              <TableHead className="px-4 py-2.5 font-semibold text-slate-400">Commercial</TableHead>
              <TableHead className="px-4 py-2.5 font-semibold text-slate-400">Execution</TableHead>
              <TableHead className="px-4 py-2.5 font-semibold text-slate-400">Day 14 target</TableHead>
              <TableHead className="px-4 py-2.5 font-semibold text-slate-400">Day 30 target</TableHead>
              <TableHead className="px-4 py-2.5 font-semibold text-slate-400 text-right">Weighted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-white/10">
            {state.options.map((option) => {
              const total = weightedScore(option)
              return (
                <TableRow key={option.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="px-4 py-2 align-top">
                    <Input
                      value={option.name}
                      onChange={(event) => updateOption(option.id, { name: event.target.value })}
                      aria-label={`${option.id}-name`}
                      title="Option name"
                      disabled={!canEdit}
                      className="w-[170px]"
                    />
                  </TableCell>
                  <TableCell className="px-4 py-2 align-top">
                    <Select
                      value={option.model}
                      onValueChange={(value) => updateOption(option.id, { model: value as DeliveryModel })}
                      disabled={!canEdit}
                    >
                      <SelectTrigger aria-label={`${option.id}-model`} title="Delivery model">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="freelancer">Freelancer</SelectItem>
                        <SelectItem value="agency">Agency</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="px-4 py-2 align-top">
                    <Input
                      type="number"
                      min={0}
                      value={option.monthlyCost}
                      onChange={(event) => updateOption(option.id, { monthlyCost: Number(event.target.value || 0) })}
                      aria-label={`${option.id}-monthly-cost`}
                      title="Monthly cost"
                      disabled={!canEdit}
                      className="w-[110px]"
                    />
                  </TableCell>
                  <TableCell className="px-4 py-2 align-top">
                    <Select
                      value={option.status}
                      onValueChange={(value) => updateOption(option.id, { status: value as OptionStatus })}
                      disabled={!canEdit}
                    >
                      <SelectTrigger aria-label={`${option.id}-status`} title="Evaluation status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="hold">Hold</SelectItem>
                        <SelectItem value="pass">Pass</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="px-4 py-2 align-top">
                    <Input
                      type="number"
                      min={0}
                      max={5}
                      step={1}
                      value={option.strategicFit}
                      onChange={(event) => updateOption(option.id, { strategicFit: clampScore(Number(event.target.value)) })}
                      aria-label={`${option.id}-strategic-fit`}
                      title="Strategic fit score"
                      disabled={!canEdit}
                      className="w-[68px]"
                    />
                  </TableCell>
                  <TableCell className="px-4 py-2 align-top">
                    <Input
                      type="number"
                      min={0}
                      max={5}
                      step={1}
                      value={option.commercialRisk}
                      onChange={(event) => updateOption(option.id, { commercialRisk: clampScore(Number(event.target.value)) })}
                      aria-label={`${option.id}-commercial-score`}
                      title="Commercial score"
                      disabled={!canEdit}
                      className="w-[68px]"
                    />
                  </TableCell>
                  <TableCell className="px-4 py-2 align-top">
                    <Input
                      type="number"
                      min={0}
                      max={5}
                      step={1}
                      value={option.executionConfidence}
                      onChange={(event) => updateOption(option.id, { executionConfidence: clampScore(Number(event.target.value)) })}
                      aria-label={`${option.id}-execution-confidence`}
                      title="Execution confidence score"
                      disabled={!canEdit}
                      className="w-[68px]"
                    />
                  </TableCell>
                  <TableCell className="px-4 py-2 align-top">
                    <Input
                      value={option.day14Target}
                      onChange={(event) => updateOption(option.id, { day14Target: event.target.value })}
                      aria-label={`${option.id}-day14-target`}
                      title="Day 14 target"
                      disabled={!canEdit}
                      className="w-[230px]"
                    />
                  </TableCell>
                  <TableCell className="px-4 py-2 align-top">
                    <Input
                      value={option.day30Target}
                      onChange={(event) => updateOption(option.id, { day30Target: event.target.value })}
                      aria-label={`${option.id}-day30-target`}
                      title="Day 30 target"
                      disabled={!canEdit}
                      className="w-[230px]"
                    />
                  </TableCell>
                  <TableCell className="px-4 py-2 align-top text-right">
                    <Badge variant={scoreBadgeVariant(total)}>{total}</Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="glass" className="p-5">
          <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-3">Live Ranking</h2>
          <div className="space-y-2">
            {ranked.map(({ option, score }, index) => (
              <Card key={option.id} variant="glass" className="border-white/10 bg-slate-950/60 rounded px-3 py-2.5 flex-row items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-white">{index + 1}. {option.name}</p>
                  <p className="text-[12px] text-slate-300">{option.model} • ${option.monthlyCost.toLocaleString()} / mo • {option.status}</p>
                </div>
                <Badge variant={scoreBadgeVariant(score)}>{score}</Badge>
              </Card>
            ))}
          </div>
        </Card>

        <Card variant="glass" className="p-5 space-y-4">
          <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400">Decision Summary</h2>
          <div className="flex flex-col gap-1.5 text-[13px]">
            <Label className="block text-slate-300">Top choice today</Label>
            <Input
              value={state.todayTopChoice}
              onChange={(event) => setState((prev) => ({ ...prev, todayTopChoice: event.target.value }))}
              disabled={!canEdit}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-1.5 text-[13px]">
            <Label className="block text-slate-300">Backup choice</Label>
            <Input
              value={state.backupChoice}
              onChange={(event) => setState((prev) => ({ ...prev, backupChoice: event.target.value }))}
              disabled={!canEdit}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-1.5 text-[13px]">
            <Label className="block text-slate-300">Next actions</Label>
            <Textarea
              value={state.nextActions}
              onChange={(event) => setState((prev) => ({ ...prev, nextActions: event.target.value }))}
              disabled={!canEdit}
              className="w-full min-h-[110px]"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-400">{statusLabel}</p>
            <Button
              type="button"
              variant="ghost"
              onClick={resetWorkspace}
              disabled={!canEdit}
              className="text-[12px] font-semibold text-slate-300 hover:text-white"
            >
              Reset workspace
            </Button>
          </div>
        </Card>
      </section>

      <Card variant="glass" className="p-5">
        <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-3">Agency vs Freelancer guardrails</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px] text-slate-300">
          <Card variant="glass" className="border-white/10 bg-slate-950/60 rounded p-4">
            <p className="text-[12px] font-semibold text-slate-100 mb-1.5">When agency is better</p>
            <p>Use when you need immediate multi-channel coverage, specialist bandwidth, and redundancy if one operator is unavailable.</p>
          </Card>
          <Card variant="glass" className="border-white/10 bg-slate-950/60 rounded p-4">
            <p className="text-[12px] font-semibold text-slate-100 mb-1.5">When freelancer is better</p>
            <p>Use when you need fast iteration, direct operator access, tighter budget control, and high accountability to one owner metric.</p>
          </Card>
        </div>
      </Card>
    </div>
  )
}
