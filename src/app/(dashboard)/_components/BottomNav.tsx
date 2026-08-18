'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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

export function BottomNav() {
  const pathname = usePathname()

  function isActive(item: { href: string }) {
    if (item.href === '/dashboard#pipeline') return pathname === '/dashboard'
    if (item.href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(item.href)
  }

  return (
    <nav aria-label="Mobile navigation" className="fixed bottom-0 left-0 right-0 z-[1000] md:hidden border-t border-white/10 bg-slate-950/90 shadow-[0_-12px_30px_rgba(15,23,42,0.32)] backdrop-blur-md safe-area-pb">
      <div className="flex items-stretch">
        {NAV_ITEMS.map(item => {
          const active = isActive(item)
          return (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={[
                'flex-1 flex flex-col items-center justify-center gap-1.5 py-2 min-h-[56px] tap-highlight-transparent border-t-2 transition-colors',
                active ? 'border-orange-400 bg-white/5' : 'border-transparent bg-transparent',
              ].join(' ')}
            >
              {item.icon(active)}
              <span
                className={[
                  'text-[12px] tracking-wide',
                  active ? 'font-bold text-orange-100' : 'font-semibold text-slate-400',
                ].join(' ')}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
