import Link from 'next/link'

type EvidenceProofCardProps = {
  claim: string
  sourceLabel: string
  sourceHref: string
  evidenceHref: string
  disclaimer: string
  className?: string
}

export function EvidenceProofCard({
  claim,
  sourceLabel,
  sourceHref,
  evidenceHref,
  disclaimer,
  className,
}: EvidenceProofCardProps) {
  return (
    <section className={className ?? ''}>
      <div className="rounded-2xl border border-success/25 bg-success/10 p-5 sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-success">Proof snapshot</p>
        <p className="mt-2 text-[15px] font-semibold leading-relaxed text-foreground">{claim}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-[12px]">
          <Link href={sourceHref} className="underline underline-offset-2 text-success hover:text-foreground transition-colors">
            {sourceLabel}
          </Link>
          <Link href={evidenceHref} className="underline underline-offset-2 text-success hover:text-foreground transition-colors">
            Evidence Hub
          </Link>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">{disclaimer}</p>
      </div>
    </section>
  )
}
