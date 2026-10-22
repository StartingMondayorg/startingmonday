'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// One nav, not three (sm-simplification-proposal 3d, P3): the same five destinations
// render as the mobile tab bar and as the desktop left rail. Settings sits at the
// foot of the rail on desktop; on mobile it stays reachable from Profile and the palette.

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path
          d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H14v-5H8v5H4a1 1 0 01-1-1V9.5z"
          stroke={active ? '#fb923c' : '#64748b'}
          strokeWidth="1.6"
          strokeLinejoin="round"
          fill={active ? '#fb923c' : 'none'}
        />
      </svg>
    ),
  },
  {
    href: '/dashboard#pipeline',
    label: 'Companies',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect
          x="3" y="7" width="16" height="12" rx="1"
          stroke={active ? '#fb923c' : '#64748b'}
          strokeWidth="1.6"
          fill={active ? '#fb923c' : 'none'}
        />
        <path
          d="M7 7V5a2 2 0 012-2h4a2 2 0 012 2v2"
          stroke={active ? '#fb923c' : '#64748b'}
          strokeWidth="1.6"
        />
        <path d="M11 12v2M8 12v2M14 12v2" stroke={active ? '#fff7ed' : '#64748b'} strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/dashboard/signals',
    label: 'Signals',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path
          d="M11 2v2M11 18v2M4.22 4.22l1.42 1.42M16.36 16.36l1.42 1.42M2 11h2M18 11h2M4.22 17.78l1.42-1.42M16.36 5.64l1.42-1.42"
          stroke={active ? '#fb923c' : '#64748b'}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="11" cy="11" r="4" fill={active ? '#fb923c' : 'none'} stroke={active ? '#fb923c' : '#64748b'} strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    href: '/dashboard/contacts',
    label: 'Contacts',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <circle
          cx="11" cy="8" r="4"
          stroke={active ? '#fb923c' : '#64748b'}
          strokeWidth="1.6"
          fill={active ? '#fb923c' : 'none'}
        />
        <path
          d="M3 20c0-3.314 3.582-6 8-6s8 2.686 8 6"
          stroke={active ? '#fb923c' : '#64748b'}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: '/dashboard/profile',
    label: 'Profile',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <circle
          cx="11" cy="11" r="9"
          stroke={active ? '#fb923c' : '#64748b'}
          strokeWidth="1.6"
          fill={active ? '#fb923c' : 'none'}
        />
        <circle cx="11" cy="9" r="3" fill={active ? '#fff7ed' : 'none'} stroke={active ? '#fff7ed' : '#64748b'} strokeWidth="1.4" />
        <path d="M5.5 18.5c0-2.485 2.462-4.5 5.5-4.5s5.5 2.015 5.5 4.5" stroke={active ? '#fff7ed' : '#64748b'} strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
]

const SETTINGS_ITEM = {
  href: '/settings',
  label: 'Settings',
  icon: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="3" stroke={active ? '#fb923c' : '#64748b'} strokeWidth="1.6" fill={active ? '#fb923c' : 'none'} />
      <path
        d="M11 2.5v2.2M11 17.3v2.2M2.5 11h2.2M17.3 11h2.2M4.99 4.99l1.56 1.56M15.45 15.45l1.56 1.56M4.99 17.01l1.56-1.56M15.45 6.55l1.56-1.56"
        stroke={active ? '#fb923c' : '#64748b'}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
}

type NavItem = { href: string; label: string; icon: (active: boolean) => React.ReactNode }

export function isPrimaryNavItemActive(pathname: string, href: string): boolean {
  if (href === '/dashboard#pipeline' || href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export const PRIMARY_NAV_HREFS = NAV_ITEMS.map(item => item.href)

function RailLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={[
        'flex w-full flex-col items-center justify-center gap-1 rounded-lg py-2.5 min-h-[56px] transition-colors',
        active ? 'bg-muted/60' : 'hover:bg-muted/40',
      ].join(' ')}
    >
      {item.icon(active)}
      <span className={['text-[10px] tracking-wide', active ? 'font-bold text-primary' : 'font-semibold text-muted-foreground'].join(' ')}>
        {item.label}
      </span>
    </Link>
  )
}

export function PrimaryNav() {
  const pathname = usePathname()

  return (
    <>
      <nav
        aria-label="Primary navigation"
        className="fixed inset-y-0 left-0 z-[900] hidden w-16 flex-col items-center gap-1 border-r border-border bg-background/95 px-1.5 py-4 backdrop-blur-md md:flex"
      >
        {NAV_ITEMS.map(item => (
          <RailLink key={`rail-${item.label}`} item={item} active={isPrimaryNavItemActive(pathname, item.href)} />
        ))}
        <div className="mt-auto w-full">
          <RailLink item={SETTINGS_ITEM} active={isPrimaryNavItemActive(pathname, SETTINGS_ITEM.href)} />
        </div>
      </nav>

      <nav aria-label="Mobile navigation" className="fixed bottom-0 left-0 right-0 z-[1000] md:hidden border-t border-border bg-background/90 shadow-md backdrop-blur-md safe-area-pb">
        <div className="flex items-stretch">
          {NAV_ITEMS.map(item => {
            const active = isPrimaryNavItemActive(pathname, item.href)
            return (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={[
                  'flex-1 flex flex-col items-center justify-center gap-1.5 py-2 min-h-[56px] tap-highlight-transparent border-t-2 transition-colors',
                  active ? 'border-primary/30 bg-muted/40' : 'border-transparent bg-transparent',
                ].join(' ')}
              >
                {item.icon(active)}
                <span
                  className={[
                    'text-[12px] tracking-wide',
                    active ? 'font-bold text-primary' : 'font-semibold text-muted-foreground',
                  ].join(' ')}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}