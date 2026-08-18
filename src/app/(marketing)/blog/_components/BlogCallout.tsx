import Link from 'next/link'

interface BlogCalloutProps {
  headline: string
  body: string
  label: string
  href: string
}

export function BlogCallout({ headline, body, label, href }: BlogCalloutProps) {
  return (
    <div className="my-8 bg-slate-900 rounded-lg px-6 py-6 not-prose">
      <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-2">Starting Monday</p>
      <p className="text-[16px] font-bold text-white mb-2 leading-snug">{headline}</p>
      <p className="text-[13px] text-slate-400 mb-4 leading-relaxed">{body}</p>
      <Link
        href={href}
        className="inline-block bg-orange-500 text-slate-900 text-[13px] font-bold px-5 py-2.5 rounded hover:bg-orange-600 transition-colors"
      >
        {label}
      </Link>
    </div>
  )
}
