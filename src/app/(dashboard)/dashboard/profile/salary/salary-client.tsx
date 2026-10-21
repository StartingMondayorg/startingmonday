'use client'
import { useState } from 'react'
import { Alert, AlertDescription, Button, Card, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
type PushbackItem = { objection: string; response: string }

type SalaryResult = {
  low: number
  target: number
  ceiling: number
  currency: string
  base: { low: number; target: number; ceiling: number }
  bonus: { target_pct: number; max_pct: number; notes: string }
  equity: { range: string; vesting: string; notes: string }
  levers: string[]
  notes: string
  negotiation_script: string
  pushback_responses: PushbackItem[]
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

const SECTORS = [
  'Technology',
  'Healthcare / Life Sciences',
  'Financial Services / Banking',
  'Retail / Consumer',
  'Manufacturing / Industrial',
  'Professional Services',
  'Media / Entertainment',
  'Energy / Utilities',
  'Government / Education / Nonprofit',
  'Other',
]

const LEVELS = [
  'VP',
  'SVP / Group VP',
  'EVP / Division President',
  'C-Suite (CIO / CTO / CISO / CDO / COO)',
  'CEO / President',
]

const COMPANY_STAGES = [
  'Startup (Seed – Series B)',
  'Growth (Series C+)',
  'PE-backed',
  'Public (mid-cap)',
  'Public (large-cap / Fortune 500)',
  'Nonprofit / Government',
]

export function SalaryIntelClient({ defaultCompany, defaultRole }: { defaultCompany: string; defaultRole: string }) {
  const [role, setRole]               = useState(defaultRole)
  const [company, setCompany]         = useState(defaultCompany)
  const [location, setLocation]       = useState('')
  const [sector, setSector]           = useState('')
  const [level, setLevel]             = useState('')
  const [companyStage, setCompanyStage] = useState('')
  const [loading, setLoading]         = useState(false)
  const [result, setResult]           = useState<SalaryResult | null>(null)
  const [error, setError]             = useState('')

  const labelCls = 'block text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!role.trim() || !company.trim() || loading) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/salary-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, company, location, sector, level, company_stage: companyStage }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error === 'upgrade_required'
          ? 'This feature requires the Executive plan.'
          : 'Failed to generate analysis. Please try again.')
        return
      }
      setResult(data)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit}>
      <Card className="p-6 flex flex-col gap-4">

        {/* Row 1: role + company */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className={labelCls}>Role <span className="text-destructive">*</span></Label>
            <Input
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="Chief Information Officer"
              required
            />
          </div>
          <div>
            <Label className={labelCls}>Company <span className="text-destructive">*</span></Label>
            <Input
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Acme Corp"
              required
            />
          </div>
        </div>

        {/* Row 2: level + sector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className={labelCls}>Level <span className="text-muted-foreground font-normal normal-case tracking-normal">optional</span></Label>
            <Select value={level || '__none__'} onValueChange={v => setLevel(!v || v === '__none__' ? '' : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select level…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select level…</SelectItem>
                {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className={labelCls}>Sector <span className="text-muted-foreground font-normal normal-case tracking-normal">optional</span></Label>
            <Select value={sector || '__none__'} onValueChange={v => setSector(!v || v === '__none__' ? '' : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select sector…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select sector…</SelectItem>
                {SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 3: company stage + location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className={labelCls}>Company stage <span className="text-muted-foreground font-normal normal-case tracking-normal">optional</span></Label>
            <Select value={companyStage || '__none__'} onValueChange={v => setCompanyStage(!v || v === '__none__' ? '' : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select stage…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select stage…</SelectItem>
                {COMPANY_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className={labelCls}>Location <span className="text-muted-foreground font-normal normal-case tracking-normal">optional</span></Label>
            <Input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="San Francisco, CA"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={!role.trim() || !company.trim() || loading}
          className="self-start"
        >
          {loading ? 'Analyzing…' : 'Generate salary analysis'}
        </Button>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </Card>
      </form>

      {result && (
        <div className="flex flex-col gap-4">

          {/* Total comp range */}
          <Card className="p-6">
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-4">Total cash compensation</p>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-[11px] text-muted-foreground mb-1">Floor</p>
                <p className="text-[22px] font-bold text-foreground">{fmt(result.low)}</p>
              </div>
              <div className="text-center border-x border-border">
                <p className="text-[11px] text-primary font-semibold mb-1">Target</p>
                <p className="text-[22px] font-bold text-primary">{fmt(result.target)}</p>
              </div>
              <div className="text-center">
                <p className="text-[11px] text-muted-foreground mb-1">Ceiling</p>
                <p className="text-[22px] font-bold text-foreground">{fmt(result.ceiling)}</p>
              </div>
            </div>
            {result.notes && (
              <p className="text-[13px] text-muted-foreground leading-relaxed border-t border-border pt-4">{result.notes}</p>
            )}
          </Card>

          {/* Component breakdown */}
          <Card className="p-6">
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-4">Compensation breakdown</p>
            <div className="flex flex-col gap-5">

              {/* Base */}
              {result.base && (
                <div>
                  <p className="text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-2">Base salary</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-0.5">Floor</p>
                      <p className="text-[16px] font-semibold text-muted-foreground">{fmt(result.base.low)}</p>
                    </div>
                    <div className="border-x border-border">
                      <p className="text-[11px] text-primary mb-0.5">Target</p>
                      <p className="text-[16px] font-semibold text-primary">{fmt(result.base.target)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-0.5">Ceiling</p>
                      <p className="text-[16px] font-semibold text-muted-foreground">{fmt(result.base.ceiling)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bonus */}
              {result.bonus && (
                <div className="border-t border-border pt-4">
                  <p className="text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-2">Annual bonus</p>
                  <div className="flex gap-6 mb-1.5">
                    <div>
                      <span className="text-[11px] text-muted-foreground">Target </span>
                      <span className="text-[14px] font-semibold text-foreground">{result.bonus.target_pct}% of base</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground">Max </span>
                      <span className="text-[14px] font-semibold text-foreground">{result.bonus.max_pct}% of base</span>
                    </div>
                  </div>
                  {result.bonus.notes && (
                    <p className="text-[12px] text-muted-foreground leading-relaxed">{result.bonus.notes}</p>
                  )}
                </div>
              )}

              {/* Equity */}
              {result.equity && (
                <div className="border-t border-border pt-4">
                  <p className="text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-2">Equity</p>
                  <p className="text-[14px] font-semibold text-foreground mb-1">{result.equity.range}</p>
                  <p className="text-[12px] text-muted-foreground mb-1">{result.equity.vesting}</p>
                  {result.equity.notes && (
                    <p className="text-[12px] text-muted-foreground leading-relaxed">{result.equity.notes}</p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Negotiation levers */}
          {result.levers?.length > 0 && (
            <Card className="p-6">
              <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Negotiation levers</p>
              <ul className="flex flex-col gap-2">
                {result.levers.map((lever, i) => (
                  <li key={i} className="flex gap-2.5 text-[13px] text-muted-foreground leading-relaxed">
                    <span className="text-primary mt-px shrink-0">→</span>
                    {lever}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Negotiation script */}
          <Card className="p-6">
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">What to say when they present the offer</p>
            <p className="text-[14px] text-muted-foreground leading-relaxed">{result.negotiation_script}</p>
          </Card>

          {/* Pushback responses */}
          {result.pushback_responses?.length > 0 && (
            <Card className="p-6">
              <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-4">Pushback responses</p>
              <div className="flex flex-col gap-5">
                {result.pushback_responses.map((item, i) => (
                  <div key={i}>
                    <p className="text-[12px] font-semibold text-muted-foreground mb-1.5">&ldquo;{item.objection}&rdquo;</p>
                    <p className="text-[14px] text-muted-foreground leading-relaxed">{item.response}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

        </div>
      )}
    </div>
  )
}
