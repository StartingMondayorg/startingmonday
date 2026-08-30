import Link from 'next/link'
import { DraftPanel } from '@/app/(dashboard)/dashboard/_components/DraftPanel'
import { buildSignalTranslation } from '../../signal-orientation'
import { SIGNAL_LABELS, type SignalDetailRow } from './company-detail-constants'
import { Badge, Button, Card } from '@/components/ui'
type Props = {
  signals: SignalDetailRow[]
  company: { id: string; name: string; sector?: string | null }
  profile: {
    positioning_summary?: string | null
    target_titles?: string[] | null
    target_sectors?: string[] | null
    role_type?: string | null
    search_persona?: string | null
  } | null
}

export function SignalsPanel(props: Props) {
  if (!props.signals.length) {
    return (
      <div className="px-6 py-10 text-center">
        <p className="text-[14px] text-muted-foreground mb-2">No signals logged yet.</p>
        <p className="text-[12px] text-muted-foreground">Paste a news headline or LinkedIn post above to log one.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {props.signals.map((sig) => {
        const sl = SIGNAL_LABELS[sig.signal_type] ?? { label: sig.signal_type, cls: 'bg-muted/60 text-muted-foreground' }
        const dateLabel = new Date(sig.signal_date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        const translation = buildSignalTranslation(
          {
            signal_type: sig.signal_type,
            signal_summary: sig.signal_summary,
            outreach_angle: sig.outreach_angle,
          },
          props.profile,
          props.company,
        )
        return (
          <div key={sig.id} className="px-6 py-5">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-[13px] text-muted-foreground">{dateLabel}</span>
              <Badge className={`tracking-[0.04em] ${sl.cls}`}>
                {sl.label}
              </Badge>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.5fr_0.8fr] gap-3">
              <Card variant="glass" className="p-4">
                <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">What happened</p>
                <p className="text-[13px] text-foreground leading-relaxed">{translation.whatHappened}</p>
              </Card>
              <Card variant="glass" className="p-4">
                <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">Why it may matter for your search</p>
                <p className="text-[13px] text-foreground leading-relaxed">{translation.whyItMatters}</p>
              </Card>
              <Card variant="glass" className="p-4 flex flex-col gap-3">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">What to do next</p>
                  <p className="text-[13px] text-foreground leading-relaxed">{translation.nextStepLabel}</p>
                </div>
                <Button
                  className="text-primary hover:text-foreground bg-primary/10 hover:bg-primary/30 border-primary/35"
                  render={<Link href={translation.nextStepHref} />}
                >
                  Open {translation.nextStepVerb}
                </Button>
              </Card>
            </div>
            {sig.outreach_angle && <p className="text-[13px] text-muted-foreground leading-relaxed italic mt-3">Original angle: {sig.outreach_angle}</p>}
            {sig.outreach_draft && <DraftPanel draft={sig.outreach_draft} />}
            {sig.source_url && /^https?:\/\//i.test(sig.source_url) ? (
              <a
                href={sig.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Source {'->'}
              </a>
            ) : sig.source_url ? (
              <span className="inline-block mt-2 text-[12px] text-muted-foreground">Source: monitored feed</span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
