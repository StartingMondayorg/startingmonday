import Link from 'next/link'
import { signalLabel, SIGNAL_COLORS_DARK } from '@/lib/intelligence/intelligence'
import { addSignalFollowUp } from '../signals/actions'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

type CompanyRef = {
  id: string
  name: string
}

export type SignalRow = {
  id: string
  signal_type: string
  signal_summary: string
  outreach_angle?: string | null
  signal_date: string
  company_id: string
  companies: CompanyRef | null
}

export type WarmPath = {
  contactId: string
  contactName: string
  contactTitle: string | null
  companyId: string
  companyName: string
  signal: SignalRow
}

export function WarmPathsSection({ warmPaths }: { warmPaths: WarmPath[] }) {
  if (warmPaths.length === 0) return null
  return (
    <Card variant="glass" id="warm-paths" className="gap-0 p-0 border-emerald-300/30">
      <div className="px-6 py-[18px] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-emerald-300">
            Warm Paths
          </h2>
          <Badge variant="success" className="h-auto font-semibold px-2 py-0.5">
            {warmPaths.length} {warmPaths.length === 1 ? 'opportunity' : 'opportunities'}
          </Badge>
        </div>
        <Link href="/dashboard/contacts" className="text-[12px] text-slate-400 hover:text-slate-200">
          All contacts
        </Link>
      </div>
      <div className="divide-y divide-white/10">
        {warmPaths.map((wp) => {
          const dateLabel = new Date(wp.signal.signal_date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          return (
            <div key={`${wp.contactId}-${wp.signal.id}`} className="px-6 py-4 flex items-start gap-4">
              <Avatar className="shrink-0 mt-0.5">
                <AvatarFallback className="bg-emerald-500/15 text-emerald-200 text-[12px] font-bold">
                  {wp.contactName[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Link
                href={`/dashboard/companies/${wp.companyId}`}
                className="flex-1 min-w-0 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300/80"
              >
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[14px] font-semibold text-slate-100">{wp.contactName}</span>
                  {wp.contactTitle && (
                    <span className="text-[12px] text-slate-400">{wp.contactTitle}</span>
                  )}
                  <span className="text-[12px] text-slate-400">at</span>
                  <span className="text-[12px] font-semibold text-slate-300">{wp.companyName}</span>
                  <Badge
                    className={`h-auto tracking-[0.06em] uppercase px-2 py-0.5 ${SIGNAL_COLORS_DARK[wp.signal.signal_type] ?? 'bg-white/10 text-slate-300'}`}
                  >
                    {signalLabel(wp.signal.signal_type)}
                  </Badge>
                  <span className="text-[11px] text-slate-400">{dateLabel}</span>
                </div>
                <p className="text-[13px] text-slate-400 leading-relaxed">{wp.signal.signal_summary}</p>
              </Link>
              <Button
                variant="secondary"
                render={<Link href={`/dashboard/contacts/${wp.contactId}/outreach`} />}
                className="shrink-0 h-auto text-emerald-100 hover:text-white bg-emerald-500/20 hover:bg-emerald-500/30 px-3 py-1.5"
              >
                Draft
              </Button>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export function PatternAlertsSection({ patternAlerts }: { patternAlerts: SignalRow[] }) {
  if (patternAlerts.length === 0) return null
  return (
    <Card variant="glass" id="pattern-alerts" className="gap-0 p-0 border-orange-300/30">
      <div className="px-6 py-[18px] border-b border-white/10 flex items-center justify-between">
        <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-orange-300">
          Pattern Alerts
        </h2>
        <Link href="/dashboard/signals" className="text-[12px] text-slate-400 hover:text-slate-200">
          Signals
        </Link>
      </div>
      <div className="divide-y divide-white/10">
        {patternAlerts.map((sig) => {
          const co = sig.companies
          const colonIdx = sig.signal_summary.indexOf(': ')
          const patternName = colonIdx > -1 ? sig.signal_summary.slice(0, colonIdx) : 'Pattern Alert'
          const patternBody = colonIdx > -1 ? sig.signal_summary.slice(colonIdx + 2) : sig.signal_summary
          const dateLabel = new Date(sig.signal_date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          const detailsHref = co ? `/dashboard/companies/${co.id}` : '/dashboard/signals'
          return (
            <div key={sig.id} className="px-6 py-5">
              <Link href={detailsHref} className="block rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {co && (
                      <span className="text-[14px] font-semibold text-slate-100 hover:text-white transition-colors">
                        {co.name}
                      </span>
                    )}
                    <Badge className="h-auto px-2 py-0.5 font-bold bg-orange-500/20 text-orange-200">
                      {patternName}
                    </Badge>
                  </div>
                  <span className="text-[12px] text-slate-400 shrink-0">{dateLabel}</span>
                </div>
                <p className="text-[13px] text-slate-200 leading-relaxed mb-1.5">{patternBody}</p>
                {sig.outreach_angle && (
                  <p className="text-[12px] text-slate-400 italic leading-relaxed">{sig.outreach_angle}</p>
                )}
              </Link>
              <form action={addSignalFollowUp} className="mt-2">
                <input type="hidden" name="company_name" value={co?.name ?? ''} />
                <input type="hidden" name="signal_summary" value={patternBody} />
                <Button
                  type="submit"
                  variant="ghost"
                  className="h-auto p-0 text-[11px] font-semibold text-slate-400 hover:text-slate-200 hover:bg-transparent"
                >
                  + Follow up in 5 days
                </Button>
              </form>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export function CompanySignalsSection({ signals }: { signals: SignalRow[] }) {
  if (signals.length === 0) return null
  return (
    <Card variant="glass" id="company-signals" className="gap-0 p-0 border-amber-300/30">
      <div className="px-6 py-[18px] border-b border-white/10 flex items-center justify-between">
        <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-amber-300">
          Company Signals
        </h2>
        <Link href="/dashboard/signals" className="text-[12px] text-slate-400 hover:text-slate-200">
          Signals
        </Link>
      </div>
      <div className="divide-y divide-white/10">
        {signals.map((sig) => {
          const co = sig.companies
          const dateLabel = new Date(sig.signal_date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          const typeLabel = signalLabel(sig.signal_type)
          const detailsHref = co ? `/dashboard/companies/${co.id}` : '/dashboard/signals'
          return (
            <div key={sig.id} className="px-6 py-4">
              <Link href={detailsHref} className="block rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/80">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  {co && (
                    <span className="text-[14px] font-semibold text-slate-100 hover:text-white transition-colors">
                      {co.name}
                    </span>
                  )}
                  <Badge className="h-auto px-2 py-0.5 font-bold bg-amber-500/15 text-amber-200">
                    {typeLabel}
                  </Badge>
                  <span className="text-[12px] text-slate-400 ml-auto">{dateLabel}</span>
                </div>
                <p className="text-[13px] text-slate-200 leading-relaxed">{sig.signal_summary}</p>
                {sig.outreach_angle && (
                  <p className="text-[12px] text-slate-400 italic mt-1 leading-relaxed">{sig.outreach_angle}</p>
                )}
              </Link>
              <form action={addSignalFollowUp} className="mt-2">
                <input type="hidden" name="company_name" value={co?.name ?? ''} />
                <input type="hidden" name="signal_summary" value={sig.signal_summary} />
                <Button
                  type="submit"
                  variant="ghost"
                  className="h-auto p-0 text-[11px] font-semibold text-slate-400 hover:text-slate-200 hover:bg-transparent"
                >
                  + Follow up in 5 days
                </Button>
              </form>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
