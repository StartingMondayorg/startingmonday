import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type OfferFields = {
  offer_role_title?: string | null
  offer_base?: number | null
  offer_bonus_pct?: number | null
  offer_signing?: number | null
  offer_equity?: string | null
  offer_notes?: string | null
  offer_decision_factors?: string | null
}

export function CompanyOfferFields({ company, companyName }: { company: OfferFields; companyName: string }) {
  const base = company.offer_base ?? 0
  const bonusPct = company.offer_bonus_pct ?? 0
  const bonusEst = base > 0 && bonusPct > 0 ? Math.round(base * bonusPct / 100) : null
  const totalCash = base > 0 ? base + (bonusEst ?? 0) : null
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="pt-1 border-t-2 border-green-200">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-green-700">Offer in Hand</p>
        {company.offer_role_title && (
          <Button
            variant="secondary"
            className="text-green-700 hover:text-green-900 bg-green-50 hover:bg-green-100"
            render={<a href={`/dashboard/salary?company=${encodeURIComponent(companyName)}&role=${encodeURIComponent(company.offer_role_title)}`} />}
          >
            Get negotiation script &rarr;
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="block text-[13px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">Role title offered</Label>
          <Input
            name="offer_role_title"
            type="text"
            defaultValue={company.offer_role_title ?? ''}
            placeholder="Chief Information Officer"
            className="w-full text-[14px] text-white placeholder:text-slate-300 focus-visible:border-slate-400"
          />
        </div>
        <div>
          <Label className="block text-[13px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">Base salary</Label>
          <Input
            name="offer_base"
            type="number"
            defaultValue={company.offer_base ?? ''}
            placeholder="380000"
            className="w-full text-[14px] text-white placeholder:text-slate-300 focus-visible:border-slate-400"
          />
        </div>
        <div>
          <Label className="block text-[13px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">Target bonus %</Label>
          <Input
            name="offer_bonus_pct"
            type="number"
            min="0"
            max="200"
            defaultValue={company.offer_bonus_pct ?? ''}
            placeholder="20"
            className="w-full text-[14px] text-white placeholder:text-slate-300 focus-visible:border-slate-400"
          />
          {bonusEst !== null && (
            <p className="mt-1 text-[13px] text-slate-400">{fmt(bonusEst)} at target</p>
          )}
        </div>
        <div>
          <Label className="block text-[13px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">Signing bonus</Label>
          <Input
            name="offer_signing"
            type="number"
            defaultValue={company.offer_signing ?? ''}
            placeholder="50000"
            className="w-full text-[14px] text-white placeholder:text-slate-300 focus-visible:border-slate-400"
          />
        </div>
      </div>
      <div className="mt-4">
        <Label className="block text-[13px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">Equity</Label>
        <Input
          name="offer_equity"
          type="text"
          defaultValue={company.offer_equity ?? ''}
          placeholder="0.5% over 4 years, 1-year cliff; or RSUs $800K vesting over 4 years"
          className="w-full text-[14px] text-white placeholder:text-slate-300 focus-visible:border-slate-400"
        />
      </div>
      <div className="mt-4">
        <Label className="block text-[13px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">Offer notes</Label>
        <Textarea
          name="offer_notes"
          rows={3}
          defaultValue={company.offer_notes ?? ''}
          placeholder="Deadline, conditions, what they said about flexibility, PTO, remote policy..."
          className="w-full text-[14px] text-white placeholder:text-slate-300 focus-visible:border-slate-400 resize-none"
        />
      </div>
      <div className="mt-4">
        <Label className="block text-[13px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">Decision factors</Label>
        <Textarea
          name="offer_decision_factors"
          rows={4}
          defaultValue={company.offer_decision_factors ?? ''}
          placeholder="Relocation required - moving family from Chicago. Partner career impact. Long-term ceiling vs current trajectory. Culture from the interviews. Manager quality. Commute. Industry pivot risk."
          className="w-full text-[14px] text-white placeholder:text-slate-300 focus-visible:border-slate-400 resize-y"
        />
        <div className="mt-1 text-[13px] text-slate-400">Everything the numbers do not capture. Private.</div>
      </div>
      {totalCash !== null && (
        <Card variant="default" className="mt-3 px-4 py-3 bg-green-50 border-green-200 flex-row items-center justify-between">
          <span className="text-[13px] font-semibold text-green-800">Total cash (base + bonus at target)</span>
          <span className="text-[16px] font-bold text-green-800">{fmt(totalCash)}</span>
        </Card>
      )}
      <div className="mt-2 text-[13px] text-slate-400">Private. Not shared or used in AI outputs.</div>
    </div>
  )
}
