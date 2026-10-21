'use client'
import { useState } from 'react'
import { Button, Input, Label, ToggleGroup, ToggleGroupItem } from '@/components/ui'
import { type SearchPersona, suggestedCompaniesForProfile } from '../onboarding-helpers'

export function StepCompanies({
  names,
  onChange,
  persona,
  currentTitle,
  targetTitles = '',
  resumeText = '',
  isPassive,
  onTitle,
}: {
  names: string[]
  onChange: (v: string[]) => void
  persona: SearchPersona | ''
  currentTitle: string
  targetTitles?: string
  resumeText?: string
  isPassive?: boolean
  onTitle?: (v: string) => void
}) {
  const suggestions = suggestedCompaniesForProfile(persona, currentTitle, resumeText)
  const inputCls = 'w-full !border-border rounded-lg px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus-visible:!border-border !bg-background/60'
  const filled = names.filter(n => n.trim()).length
  const cooSignalContext = `${currentTitle} ${targetTitles}`.toLowerCase()
  const isCooTrack = /\bcoo\b|chief\s+operating\s+officer/.test(cooSignalContext)

  const [discovering, setDiscovering] = useState(false)
  const [discovered, setDiscovered] = useState<{ name: string; sector: string; fit: number }[] | null>(null)
  const [discoverError, setDiscoverError] = useState(false)

  async function discover() {
    setDiscovering(true)
    setDiscoverError(false)
    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            currentTitle: currentTitle || undefined,
            persona: persona || undefined,
          },
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setDiscovered(Array.isArray(data) ? data.slice(0, 9) : [])
    } catch {
      setDiscoverError(true)
    } finally {
      setDiscovering(false)
    }
  }

  function update(i: number, val: string) {
    const next = [...names]
    next[i] = val
    if (i === names.length - 1 && val.trim() && names.length < 8) next.push('')
    onChange(next)
  }

  function addName(name: string) {
    if (names.some(n => n.trim().toLowerCase() === name.toLowerCase())) return
    const emptyIdx = names.findIndex(n => !n.trim())
    if (emptyIdx >= 0) {
      const next = [...names]
      next[emptyIdx] = name
      onChange(next)
    } else {
      onChange([...names, name])
    }
  }

  function removeName(name: string) {
    const next = names.filter(n => n.trim().toLowerCase() !== name.toLowerCase())
    if (!next.some(n => !n.trim())) next.push('')
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-serif font-bold text-foreground leading-tight mb-2">
          {isPassive ? 'Which companies do you want to monitor?' : 'Which companies are you targeting?'}
        </h1>
        <p className="text-[15px] text-muted-foreground">
          {isPassive
            ? 'We scan their career pages and alert you when something worth knowing appears.'
            : 'Add at least one. We scan their career pages and alert you when a matching role appears.'}
        </p>
        <p className="text-[12px] text-muted-foreground mt-1.5">
          Why this matters: these are the companies where we help you take your place before competition sees the opening.
        </p>
        {isCooTrack && (
          <p className="text-[12px] text-primary mt-2">
            COO note: these mandates are rarely posted. Prioritize companies where you already have relationships, and watch M&amp;A and operational-announcement signals to spot mandate creation early.
          </p>
        )}
      </div>

      {isPassive && onTitle && (
        <div>
          <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
            Your current title
          </Label>
          <Input
            type="text"
            value={currentTitle}
            onChange={e => onTitle(e.target.value)}
            placeholder="Chief Information Officer"
            className={inputCls}
          />
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {names.map((name, i) => (
          <Input
            key={i}
            type="text"
            value={name}
            onChange={e => update(i, e.target.value)}
            placeholder={i === 0 ? 'Company name' : i < 3 ? 'Add another' : 'Add more'}
            className={inputCls}
          />
        ))}
      </div>

      {suggestions.length > 0 && !discovered && (
        <div>
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-2">Great choices for you</p>
          <ToggleGroup
            multiple
            value={suggestions.filter(s => names.some(n => n.trim().toLowerCase() === s.name.toLowerCase())).map(s => s.name)}
            onValueChange={(values) => {
              for (const s of suggestions) {
                const pressed = values.includes(s.name)
                const added = names.some(n => n.trim().toLowerCase() === s.name.toLowerCase())
                if (pressed && !added) addName(s.name)
                if (!pressed && added) removeName(s.name)
              }
            }}
            className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2"
          >
            {suggestions.map((s) => {
              const added = names.some(n => n.trim().toLowerCase() === s.name.toLowerCase())
              return (
                <ToggleGroupItem
                  key={s.name}
                  value={s.name}
                  className={`flex-col h-auto items-start justify-start text-left rounded border p-3 whitespace-normal transition-colors cursor-pointer ${
                    added
                      ? '!border-primary/70 !bg-primary/20 !text-foreground hover:!bg-primary/25 hover:!border-primary/30'
                      : '!border-border !bg-muted/40 !text-foreground hover:!border-border'
                  }`}
                >
                  <p className="text-[14px] font-semibold">{added ? '✓ ' : '+ '}{s.name}</p>
                  <p className={['mt-1 text-[12px] leading-relaxed', added ? 'text-foreground' : 'text-muted-foreground'].join(' ')}>{s.roleHint}</p>
                  <p className={['mt-1 text-[12px] leading-relaxed', added ? 'text-foreground' : 'text-muted-foreground'].join(' ')}>{s.why}</p>
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>
        </div>
      )}

      {/* AI Discovery */}
      {!discovered && !discovering && (
        <Button
          type="button"
          variant="ghost"
          onClick={discover}
          className="h-auto p-0 !bg-transparent justify-start text-left text-[13px] font-normal text-muted-foreground hover:text-foreground"
        >
          {discoverError ? 'Could not load suggestions - try again ->' : 'Not sure where to start? Discover companies with AI ->'}
        </Button>
      )}

      {discovering && (
        <p className="text-[13px] text-muted-foreground">Finding companies for you...</p>
      )}

      {discovered && discovered.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground">AI-suggested companies</p>
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setDiscovered(null); setDiscoverError(false) }}
              className="h-auto p-0 !bg-transparent text-[11px] font-normal text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          </div>
          <ToggleGroup
            multiple
            value={discovered.filter(co => names.some(n => n.trim().toLowerCase() === co.name.toLowerCase())).map(co => co.name)}
            onValueChange={(values) => {
              for (const co of discovered) {
                const pressed = values.includes(co.name)
                const added = names.some(n => n.trim().toLowerCase() === co.name.toLowerCase())
                if (pressed && !added) addName(co.name)
                if (!pressed && added) removeName(co.name)
              }
            }}
            className="flex flex-wrap gap-2"
          >
            {discovered.map(co => {
              const added = names.some(n => n.trim().toLowerCase() === co.name.toLowerCase())
              return (
                <ToggleGroupItem
                  key={co.name}
                  value={co.name}
                  className={`text-[13px] rounded border px-3 py-1.5 transition-colors cursor-pointer ${
                    added
                      ? '!border-primary/70 !bg-primary/20 !text-foreground hover:!bg-primary/25 hover:!border-primary/30'
                      : '!border-border !bg-muted/40 !text-foreground hover:!border-border'
                  }`}
                >
                  {added ? '\u2713 ' : '+ '}{co.name}
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>
        </div>
      )}

      <p className="text-[12px] text-muted-foreground">
        {filled === 0
          ? 'Add at least one company to continue.'
          : filled === 1
          ? 'Good start. Add 2 more for the best coverage.'
          : filled >= 3
          ? `${filled} companies added. You can add more after setup.`
          : `${filled} added. One more recommended.`}
      </p>
    </div>
  )
}