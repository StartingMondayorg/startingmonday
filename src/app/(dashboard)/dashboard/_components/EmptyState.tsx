import Link from 'next/link'

type EmptyStateProps = {
  icon?: React.ReactNode
  title: string
  body: string
  cta?: { label: string; href: string }
  ctaSecondary?: { label: string; href: string }
}

export function EmptyState({ icon, title, body, cta, ctaSecondary }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {icon && (
        <div className="mb-5 w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          {icon}
        </div>
      )}
      <h3 className="text-[16px] font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-[14px] text-slate-500 leading-relaxed max-w-sm mb-6">{body}</p>
      {(cta || ctaSecondary) && (
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {cta && (
            <Link
              href={cta.href}
              className="bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-semibold px-5 py-2.5 rounded transition-colors"
            >
              {cta.label}
            </Link>
          )}
          {ctaSecondary && (
            <Link
              href={ctaSecondary.href}
              className="text-[13px] font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              {ctaSecondary.label}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export const EMPTY_ICONS = {
  companies: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="8" width="18" height="13" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 13v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  contacts: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  signals: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  followups: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 15h4M8 18h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
}
