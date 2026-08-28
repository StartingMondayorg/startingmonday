'use client'

import { useRouter } from 'next/navigation'
import { useRef, useEffect, useTransition } from 'react'
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
interface Props {
  q: string
  stage: string
  stages: Array<{ key: string; label: string }>
}

export function PipelineFilter({ q, stage, stages }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const qRef = useRef(q)
  const stageRef = useRef(stage)
  const inputRef = useRef<HTMLInputElement>(null)

  // When q changes externally (e.g. user clicks Clear), sync the input imperatively.
  // Skip if the input is focused - user may still be typing and we don't want to overwrite them.
  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current && inputRef.current.value !== q) {
      inputRef.current.value = q
      qRef.current = q
    }
  }, [q])

  function navigate(newQ: string, newStage: string) {
    const params = new URLSearchParams()
    if (newQ) params.set('q', newQ)
    if (newStage) params.set('stage', newStage)
    params.set('page', '0')
    const qs = params.toString()
    // startTransition keeps current content visible while the server re-renders,
    // preventing the loading skeleton from flashing and wiping focus.
    startTransition(() => {
      router.push(`/dashboard${qs ? '?' + qs : ''}`, { scroll: false })
    })
  }

  function onQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    clearTimeout(timer.current)
    const val = e.target.value
    qRef.current = val
    timer.current = setTimeout(() => navigate(val, stageRef.current), 350)
  }

  function onStageChange(rawVal: string | null) {
    clearTimeout(timer.current)
    const val = !rawVal || rawVal === 'all' ? '' : rawVal
    stageRef.current = val
    navigate(qRef.current, val)
  }

  const hasFilters = !!(q || stage)

  return (
    <div className="px-4 sm:px-6 py-3 border-b border-border">
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          ref={inputRef}
          type="text"
          defaultValue={q}
          onChange={onQueryChange}
          placeholder="Search companies…"
          className="flex-1 min-w-[120px] border-border bg-background/70 text-foreground placeholder:text-muted-foreground"
        />
        <Select value={stage || 'all'} onValueChange={onStageChange}>
          <SelectTrigger aria-label="Filter by stage" className="border-border text-foreground bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {stages.map(({ key, label }) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="link" size="sm" className="text-muted-foreground hover:text-foreground" render={<a href="/dashboard" />}>
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
