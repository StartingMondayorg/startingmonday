import Link from 'next/link'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui'
export type BreadcrumbItem = {
  label: string
  href?: string | null
}

export function Breadcrumbs({ items, className = '' }: { items: BreadcrumbItem[]; className?: string }) {
  if (!items.length) return null

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList className="flex-nowrap gap-2 text-[12px] text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <BreadcrumbItem key={`${item.label}-${index}`} className="gap-2">
              {item.href && !isLast ? (
                <BreadcrumbLink render={<Link href={item.href} className="hover:text-muted-foreground transition-colors" />}>
                  {item.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage
                  aria-current={isLast ? 'page' : undefined}
                  className={isLast ? 'text-muted-foreground font-semibold' : undefined}
                >
                  {item.label}
                </BreadcrumbPage>
              )}
              {!isLast && <BreadcrumbSeparator className="text-muted-foreground">/</BreadcrumbSeparator>}
            </BreadcrumbItem>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
