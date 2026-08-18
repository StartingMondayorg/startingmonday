import Link from 'next/link'
import type { ReactNode } from 'react'

import { SiteFooter } from '@/components/SiteFooter'
import { PublicPageHeader } from '@/components/PublicPageHeader'

import { LEARN_MORE_CITATIONS } from './content'

export function LearnMorePageShell({
  backHref,
  children,
}: {
  backHref: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <PublicPageHeader backHref={backHref} />
      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">{children}</main>
      <SiteFooter className="bg-slate-950" />
    </div>
  )
}

export function CitationSup({ numbers }: { numbers?: number[] }) {
  if (!numbers || numbers.length === 0) return null

  return (
    <sup className="ml-1 whitespace-nowrap text-[10px] font-semibold text-orange-300">
      {numbers.map((number, index) => (
        <span key={number}>
          <Link href={`#citation-${number}`} className="hover:text-orange-200">
            {number}
          </Link>
          {index < numbers.length - 1 ? ',' : ''}
        </span>
      ))}
    </sup>
  )
}

export function ProofAndCitationsSection() {
  return (
    <section className="mt-14 border-t border-white/10 pt-10">
      <div className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-200">References</p>
        <h2 className="mt-3 text-[1.7rem] font-serif leading-tight text-white sm:text-[2.1rem]">Sources and evidence.</h2>
        <p className="mt-3 text-[14px] leading-relaxed text-slate-300">
          Citations draw from public pilot data, published methodology notes, and the reference pages maintained within the product.
        </p>
      </div>

      <ol className="mt-6 space-y-3">
        {LEARN_MORE_CITATIONS.map((citation) => (
          <li key={citation.id} id={`citation-${citation.id}`} className="flex gap-3 text-[13px] leading-relaxed text-slate-300">
            <span className="shrink-0 font-semibold text-white">{citation.id}.</span>
            <span>
              {citation.claim}{' '}
              <span className="text-slate-400">{citation.source}.</span>{' '}
              {citation.external ? (
                <a href={citation.href} target="_blank" rel="noopener noreferrer" className="text-orange-300 hover:text-orange-200 underline underline-offset-2">
                  {citation.href}
                </a>
              ) : (
                <Link href={citation.href} className="text-orange-300 hover:text-orange-200 underline underline-offset-2">
                  startingmonday.app{citation.href}
                </Link>
              )}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}