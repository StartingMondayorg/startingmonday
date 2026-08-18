import Link from 'next/link'

export type BreadcrumbItem = {
  label: string
  href?: string | null
}

export function Breadcrumbs({ items, className = '' }: { items: BreadcrumbItem[]; className?: string }) {
  if (!items.length) return null

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-2 text-[12px] text-slate-400">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-slate-200 transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className={isLast ? 'text-slate-200 font-semibold' : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && <span className="text-slate-600">/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}