'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

// R-3 (2026-10-21): positioning, strategy, compensation, and branding were standalone routes; they are tabs of the one Profile destination now.
const TABS = [
  { href: '/dashboard/profile', label: 'Profile', exact: true },
  { href: '/dashboard/profile/positioning', label: 'Positioning' },
  { href: '/dashboard/profile/strategy', label: 'Strategy' },
  { href: '/dashboard/profile/salary', label: 'Compensation' },
  { href: '/dashboard/profile/branding', label: 'Brand' },
  { href: '/dashboard/profile/tailor', label: 'Resume tailor' },
]

export default function ProfileTabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <>
      <nav aria-label="Profile sections" className="border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => {
              const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
              return (
                <Button
                  key={tab.href}
                  variant="ghost"
                  render={<Link href={tab.href} aria-current={isActive ? 'page' : undefined} />}
                  className={cn(
                    'h-auto flex-shrink-0 rounded-none border-b-2 px-4 py-3 text-[13px] font-medium whitespace-nowrap hover:bg-transparent',
                    isActive
                      ? 'border-primary/30 text-primary hover:text-primary'
                      : 'border-transparent text-muted-foreground hover:text-muted-foreground',
                  )}
                >
                  {tab.label}
                </Button>
              )
            })}
          </div>
        </div>
      </nav>
      {children}
    </>
  )
}