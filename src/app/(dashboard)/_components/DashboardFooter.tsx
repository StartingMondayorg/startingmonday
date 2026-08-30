import Link from 'next/link'

const PRODUCT_LINKS = [
  { href: '/dashboard/briefing', label: 'Briefing' },
  { href: '/dashboard/signals', label: 'Signals' },
  { href: '/dashboard/contacts', label: 'Contacts' },
  { href: '/dashboard/calendar', label: 'Calendar' },
  { href: '/dashboard/plan', label: 'Weekly plan' },
]

const ACCOUNT_LINKS = [
  { href: '/dashboard/profile', label: 'Profile' },
  { href: '/settings', label: 'Settings' },
  { href: '/dashboard/help', label: 'Help' },
]

const COMPANY_LINKS = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/security', label: 'Security' },
]

export function DashboardFooter() {
  return (
    <footer id="dashboard-footer" className="relative border-t border-border bg-card/85 px-4 sm:px-6 py-12 pb-32 md:pb-16">
      <div className="max-w-6xl mx-auto">
        <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
          <span className="text-foreground">STARTING </span>
          <span className="text-primary">MONDAY</span>
        </p>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
          <nav className="space-y-2" aria-label="Product">
            <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">Product</p>
            {PRODUCT_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="block text-[12px] text-muted-foreground hover:text-foreground transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>
          <nav className="space-y-2" aria-label="Account">
            <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">Account</p>
            {ACCOUNT_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="block text-[12px] text-muted-foreground hover:text-foreground transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>
          <nav className="space-y-2" aria-label="Company">
            <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">Company</p>
            {COMPANY_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="block text-[12px] text-muted-foreground hover:text-foreground transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-8 text-[11px] text-muted-foreground max-w-3xl leading-relaxed">
          Private by default. We do not share your data with recruiters, employers, or third parties.
        </p>

        <div className="mt-6 border-t border-border pt-5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <p>© {new Date().getFullYear()} Starting Monday. All rights reserved.</p>
          <a href="#top" className="text-muted-foreground hover:text-foreground transition-colors">
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  )
}
