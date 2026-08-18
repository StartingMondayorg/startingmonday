'use client'
import Link from 'next/link'

export function DemoBanner() {
  return (
    <div className="bg-amber-950 border-b border-amber-900 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
      <p className="text-[12px] text-amber-200 leading-relaxed">
        <span className="font-semibold">Demo account</span> - exploring Sarah Chen&rsquo;s pipeline: VP Engineering targeting CTO roles in health tech.
        Briefs, briefings, and strategy are pre-generated.
      </p>
      <Link
        href="/signup"
        className="shrink-0 text-[12px] font-semibold text-white bg-amber-700 hover:bg-amber-600 px-3 py-1.5 rounded transition-colors"
      >
        Start free &rarr;
      </Link>
    </div>
  )
}
