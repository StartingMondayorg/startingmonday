import Link from 'next/link'
import { LogoutButton } from '../logout-button'

type CompanyListItem = {
  name: string
  stage: string
}

type DashboardPostPlacementViewProps = {
  greeting: string
  firstName: string
  today: string
  placedCompany: string | null
  isPaid: boolean
  tier: string
  totalCount: number
  allList: CompanyListItem[]
  canUseOutreachHub: boolean
  isRothschildAdmin: boolean
  profileNameOrEmail: string
}

export function DashboardPostPlacementView({
  greeting,
  firstName,
  today,
  placedCompany,
  isPaid,
  tier,
  totalCount,
  allList,
  canUseOutreachHub,
  isRothschildAdmin,
  profileNameOrEmail,
}: DashboardPostPlacementViewProps) {
  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="dark bg-card">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-12 sm:h-14 flex items-center gap-4 sm:gap-6">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground shrink-0">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <div className="hidden sm:flex items-center gap-4 flex-1">
            <Link href="/dashboard/contacts" className="text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Contacts</Link>
            <Link href="/dashboard/chat" className="text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Chat</Link>
            <Link href="/dashboard/feedback" className="text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Feedback</Link>
            {canUseOutreachHub && (
              <Link href="/dashboard/outreach" className="text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Outreach</Link>
            )}
            <div className="ml-auto flex items-center gap-4 shrink-0">
              <span aria-current="page" className="text-[12px] font-semibold text-primary whitespace-nowrap border border-primary/40 bg-primary/10 px-3 py-1.5 rounded-full">Dashboard</span>
              <Link href="/dashboard/profile" className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">{profileNameOrEmail}</Link>
              <Link href="/settings/billing" className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">Billing</Link>
              {isRothschildAdmin && (
                <Link href="/dashboard/admin" className="text-[12px] font-semibold text-primary hover:text-foreground transition-colors whitespace-nowrap border border-primary/40 bg-primary/10 px-3 py-1.5 rounded-full">Admin</Link>
              )}
              <LogoutButton label="Sign out" />
            </div>
          </div>
          <div className="flex sm:hidden items-center gap-2 ml-auto">
            <span
              aria-current="page"
              className="inline-flex min-h-[44px] items-center rounded-md border border-primary/40 bg-primary/10 px-3 text-[12px] font-semibold text-primary"
            >
              Dashboard
            </span>
            <LogoutButton label="Sign out" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-10">
        <div className="mb-8">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-primary mb-2">Career Intelligence</p>
          <h1 className="text-[26px] font-bold text-foreground leading-tight">
            {greeting}, {firstName}.
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">{today}</p>
        </div>

        <div className="bg-card border border-border rounded p-6 mb-6">
          <p className="text-[13px] font-semibold text-foreground mb-1">
            {placedCompany ? `You placed at ${placedCompany}.` : 'Your search is complete.'}
          </p>
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
            Your companies, contacts, and research history are all here. Your weekly intelligence digest is running -- you will hear from us every Monday.
          </p>
          {isPaid && tier !== 'passive' && tier !== 'free' ? (
            <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/30 rounded mb-4">
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-foreground mb-0.5">Stay sharp at $49/mo</p>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Switch to Monitor for ongoing market monitoring without active search tools. Most executives search again within 3 years.
                </p>
              </div>
              <Link
                href="/settings/billing"
                className="shrink-0 text-[12px] font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors px-4 py-2 rounded"
              >
                Review options
              </Link>
            </div>
          ) : !isPaid ? (
            <Link
              href="/settings/billing"
              className="inline-block text-[13px] font-semibold text-muted-foreground border border-border rounded px-4 py-2 hover:bg-muted transition-colors"
            >
              Keep your signal monitoring running - subscribe to Monitor ($49/mo)
            </Link>
          ) : null}
        </div>

        <div className="bg-card border border-border rounded overflow-hidden mb-6">
          <div className="px-6 py-[18px] border-b border-border flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
              Your Companies ({totalCount})
            </span>
            <Link href="/dashboard" className="text-[12px] text-muted-foreground transition-colors">
              Manage
            </Link>
          </div>
          {allList.length === 0 ? (
            <p className="px-6 py-8 text-[13px] text-muted-foreground">No companies in your list yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {allList.slice(0, 20).map(c => (
                <li key={c.name} className="px-6 py-3 flex items-center justify-between">
                  <span className="text-[13px] text-muted-foreground">{c.name}</span>
                  <span className="text-[11px] text-muted-foreground capitalize">{c.stage}</span>
                </li>
              ))}
              {allList.length > 20 && (
                <li className="px-6 py-3 text-[12px] text-muted-foreground">
                  +{allList.length - 20} more. <Link href="/dashboard" className="underline">View all</Link>
                </li>
              )}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/dashboard/contacts" className="bg-card border border-border rounded p-5 transition-colors">
            <p className="text-[13px] font-semibold text-foreground mb-1">Contacts</p>
            <p className="text-[12px] text-muted-foreground leading-relaxed">Your network at target companies.</p>
          </Link>
          <Link href="/dashboard/chat" className="bg-card border border-border rounded p-5 transition-colors">
            <p className="text-[13px] font-semibold text-foreground mb-1">Career Advisor</p>
            <p className="text-[12px] text-muted-foreground leading-relaxed">Ask anything about your next move.</p>
          </Link>
          {canUseOutreachHub && (
            <Link href="/dashboard/outreach" className="bg-card border border-border rounded p-5 transition-colors">
              <p className="text-[13px] font-semibold text-foreground mb-1">Outreach Hub</p>
              <p className="text-[12px] text-muted-foreground leading-relaxed">Send queue, follow-ups, and personalized prospects.</p>
            </Link>
          )}
        </div>

        <div className="mt-10 text-center">
          <Link href="/dashboard/profile" className="text-[12px] text-muted-foreground transition-colors">
            Update your profile
          </Link>
        </div>
      </main>
    </div>
  )
}
