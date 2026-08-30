import { Card } from '@/components/ui'
import type { CompanyFitSummary } from '../../signal-orientation'

export function CompanyFitCard({ fitSummary }: { fitSummary: CompanyFitSummary }) {
  return (
    <Card variant="glass" className="mb-6 rounded-xl border-warning/20 bg-warning/5 p-5">
      <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-warning mb-3">Company fit</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-[12px] font-semibold text-foreground mb-2">Why this fits</p>
          <ul className="space-y-2 text-[13px] text-muted-foreground leading-relaxed">
            {fitSummary.whyThisFits.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
        <div>
          <p className="text-[12px] font-semibold text-foreground mb-2">Risks to verify</p>
          <ul className="space-y-2 text-[13px] text-muted-foreground leading-relaxed">
            {fitSummary.risksToVerify.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
        <div>
          <p className="text-[12px] font-semibold text-foreground mb-2">Best roles to watch</p>
          <ul className="space-y-2 text-[13px] text-muted-foreground leading-relaxed">
            {fitSummary.bestRolesToWatch.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
      </div>
    </Card>
  )
}
