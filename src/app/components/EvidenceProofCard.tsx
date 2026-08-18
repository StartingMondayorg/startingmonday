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
      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5 sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-300">Proof snapshot</p>
        <p className="mt-2 text-[15px] font-semibold leading-relaxed text-white">{claim}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-[12px]">
          <Link href={sourceHref} className="underline underline-offset-2 text-emerald-200 hover:text-white transition-colors">
            {sourceLabel}
          </Link>
          <Link href={evidenceHref} className="underline underline-offset-2 text-emerald-200 hover:text-white transition-colors">
            Evidence Hub
          </Link>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-slate-200">{disclaimer}</p>
      </div>
    </section>
  )
}
