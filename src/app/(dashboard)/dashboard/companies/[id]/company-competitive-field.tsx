import { Textarea } from '@/components/ui/textarea'

type Props = {
  competitiveContext: string | null
}

export function CompanyCompetitiveField({ competitiveContext }: Props) {
  return (
    <div className="pt-1 border-t border-white/10">
      <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-orange-500 mb-2">Competitive Field</p>
      <Textarea
        name="competitive_context"
        rows={3}
        defaultValue={competitiveContext ?? ''}
        placeholder="Known candidates, internal shortlist, search firm intel, who else they're considering..."
        className="w-full text-[14px] text-white placeholder:text-slate-300 focus-visible:border-slate-400 resize-none"
      />
      <p className="mt-1.5 text-[11px] text-slate-400">Private. Used to sharpen your Win Thesis and pushback prep.</p>
    </div>
  )
}
