import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export type BreadcrumbItem = {
  label: string
  href?: string | null
}

export function Breadcrumbs({ items, className = '' }: { items: BreadcrumbItem[]; className?: string }) {
  if (!items.length) return null

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList className="flex-nowrap gap-2 text-[12px] text-slate-400">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <BreadcrumbItem key={`${item.label}-${index}`} className="gap-2">
              {item.href && !isLast ? (
                <BreadcrumbLink render={<Link href={item.href} className="hover:text-slate-200 transition-colors" />}>
                  {item.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage
                  aria-current={isLast ? 'page' : undefined}
                  className={isLast ? 'text-slate-200 font-semibold' : undefined}
                >
                  {item.label}
                </BreadcrumbPage>
              )}
              {!isLast && <BreadcrumbSeparator className="text-slate-600">/</BreadcrumbSeparator>}
            </BreadcrumbItem>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
