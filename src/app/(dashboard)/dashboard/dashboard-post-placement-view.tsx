import Link from 'next/link'
import { LogoutButton } from './logout-button'

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
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-slate-900">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-12 sm:h-14 flex items-center gap-4 sm:gap-6">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400 shrink-0">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </span>
          <div className="hidden sm:flex items-center gap-4 flex-1">
            <Link href="/dashboard/contacts" className="text-[12px] font-semibold text-slate-300 hover:text-white transition-colors">Contacts</Link>
            <Link href="/dashboard/chat" className="text-[12px] font-semibold text-slate-300 hover:text-white transition-colors">Chat</Link>
            <Link href="/dashboard/feedback" className="text-[12px] font-semibold text-slate-300 hover:text-white transition-colors">Feedback</Link>
            {canUseOutreachHub && (
              <Link href="/dashboard/outreach" className="text-[12px] font-semibold text-slate-300 hover:text-white transition-colors">Outreach</Link>
            )}
            <div className="ml-auto flex items-center gap-4 shrink-0">
              <span aria-current="page" className="text-[12px] font-semibold text-orange-300 whitespace-nowrap border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 rounded-full">Dashboard</span>
              <Link href="/dashboard/profile" className="text-[12px] text-slate-300 hover:text-white transition-colors">{profileNameOrEmail}</Link>
              <Link href="/settings/billing" className="text-[12px] text-slate-300 hover:text-white transition-colors">Billing</Link>
              {isRothschildAdmin && (
                <Link href="/dashboard/admin" className="text-[12px] font-semibold text-orange-300 hover:text-white transition-colors whitespace-nowrap border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 rounded-full">Admin</Link>
              )}
              <LogoutButton label="Sign out" />
            </div>
          </div>
          <div className="flex sm:hidden items-center gap-2 ml-auto">
            <span
              aria-current="page"
              className="inline-flex min-h-[44px] items-center rounded-md border border-orange-500/40 bg-orange-500/10 px-3 text-[12px] font-semibold text-orange-300"
            >
              Dashboard
            </span>
            <LogoutButton label="Sign out" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-10">
        <div className="mb-8">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-2">Career Intelligence</p>
          <h1 className="text-[26px] font-bold text-slate-900 leading-tight">
            {greeting}, {firstName}.
          </h1>
          <p className="text-[13px] text-slate-500 mt-1.5">{today}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded p-6 mb-6">
          <p className="text-[13px] font-semibold text-slate-900 mb-1">
            {placedCompany ? `You placed at ${placedCompany}.` : 'Your search is complete.'}
          </p>
          <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
            Your companies, contacts, and research history are all here. Your weekly intelligence digest is running -- you will hear from us every Monday.
          </p>
          {isPaid && tier !== 'passive' && tier !== 'free' ? (
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded mb-4">
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-slate-900 mb-0.5">Stay sharp at $49/mo</p>
                <p className="text-[12px] text-slate-600 leading-relaxed">
                  Switch to Monitor for ongoing market monitoring without active search tools. Most executives search again within 3 years.
                </p>
              </div>
              <Link
                href="/settings/billing"
                className="shrink-0 text-[12px] font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors px-4 py-2 rounded"
              >
                Review options
              </Link>
            </div>
          ) : !isPaid ? (
            <Link
              href="/settings/billing"
              className="inline-block text-[13px] font-semibold text-slate-700 border border-slate-200 rounded px-4 py-2 hover:bg-slate-50 transition-colors"
            >
              Keep your signal monitoring running - subscribe to Monitor ($49/mo)
            </Link>
          ) : null}
        </div>

        <div className="bg-white border border-slate-200 rounded overflow-hidden mb-6">
          <div className="px-6 py-[18px] border-b border-slate-200 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400">
              Your Companies ({totalCount})
            </span>
            <Link href="/dashboard" className="text-[12px] text-slate-500 hover:text-slate-700 transition-colors">
              Manage
            </Link>
          </div>
          {allList.length === 0 ? (
            <p className="px-6 py-8 text-[13px] text-slate-400">No companies in your list yet.</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {allList.slice(0, 20).map(c => (
                <li key={c.name} className="px-6 py-3 flex items-center justify-between">
                  <span className="text-[13px] text-slate-700">{c.name}</span>
                  <span className="text-[11px] text-slate-400 capitalize">{c.stage}</span>
                </li>
              ))}
              {allList.length > 20 && (
                <li className="px-6 py-3 text-[12px] text-slate-400">
                  +{allList.length - 20} more. <Link href="/dashboard" className="underline">View all</Link>
                </li>
              )}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/dashboard/contacts" className="bg-white border border-slate-200 rounded p-5 hover:border-slate-300 transition-colors">
            <p className="text-[13px] font-semibold text-slate-900 mb-1">Contacts</p>
            <p className="text-[12px] text-slate-400 leading-relaxed">Your network at target companies.</p>
          </Link>
          <Link href="/dashboard/chat" className="bg-white border border-slate-200 rounded p-5 hover:border-slate-300 transition-colors">
            <p className="text-[13px] font-semibold text-slate-900 mb-1">Career Advisor</p>
            <p className="text-[12px] text-slate-400 leading-relaxed">Ask anything about your next move.</p>
          </Link>
          {canUseOutreachHub && (
            <Link href="/dashboard/outreach" className="bg-white border border-slate-200 rounded p-5 hover:border-slate-300 transition-colors">
              <p className="text-[13px] font-semibold text-slate-900 mb-1">Outreach Hub</p>
              <p className="text-[12px] text-slate-400 leading-relaxed">Send queue, follow-ups, and personalized prospects.</p>
            </Link>
          )}
        </div>

        <div className="mt-10 text-center">
          <Link href="/dashboard/profile" className="text-[12px] text-slate-400 hover:text-slate-600 transition-colors">
            Update your profile
          </Link>
        </div>
      </main>
    </div>
  )
}
