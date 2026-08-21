import { Textarea } from '@/components/ui'
type Props = {
  competitiveContext: string | null
}

export function CompanyCompetitiveField({ competitiveContext }: Props) {
  return (
    <div className="pt-1 border-t border-border">
      <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-primary mb-2">Competitive Field</p>
      <Textarea
        name="competitive_context"
        rows={3}
        defaultValue={competitiveContext ?? ''}
        placeholder="Known candidates, internal shortlist, search firm intel, who else they're considering..."
        className="w-full text-[14px] text-primary-foreground placeholder:text-muted-foreground focus-visible:border-border resize-none"
      />
      <p className="mt-1.5 text-[11px] text-muted-foreground">Private. Used to sharpen your Win Thesis and pushback prep.</p>
    </div>
  )
}
