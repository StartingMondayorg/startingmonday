import Link from 'next/link'

type DashboardProfileIntelligenceSectionProps = {
  profileScore: number
  profileHref: string
  nextProfileSection: { label: string } | undefined
  onSaveQuickProfile: (formData: FormData) => void | Promise<void>
  quickProfileDefaults: {
    fullName: string
    currentTitle: string
    positioningSummary: string
  }
  stats: Array<{
    value: number
    label: string
    alert: boolean
    amber: boolean
    href: string
  }>
  totalCount: number
  contactCoverageCount: number
  numIntelGaps: number
  companiesWithoutContact: Array<{ name: string }>
  prospectContactCount: number
  companiesWithoutBrief: Array<{ name: string }>
  opportunityRadar: React.ReactNode
  isExecutiveMode: boolean
}

export function DashboardProfileIntelligenceSection({
  profileScore,
  profileHref,
  nextProfileSection,
  onSaveQuickProfile,
  quickProfileDefaults,
  stats,
  totalCount,
  contactCoverageCount,
  numIntelGaps,
  companiesWithoutContact,
  prospectContactCount,
  companiesWithoutBrief,
  opportunityRadar,
  isExecutiveMode,
}: DashboardProfileIntelligenceSectionProps) {
  const showNetworkHealth =
    totalCount >= 3 &&
    contactCoverageCount < totalCount &&
    contactCoverageCount / totalCount < 0.5

  const rankedAttentionCard = (() => {
    if (companiesWithoutContact.length > 0) {
      return {
        href: '/dashboard/contacts',
        count: companiesWithoutContact.length,
        title: `${companiesWithoutContact.length === 1 ? 'company' : 'companies'} with no contact`,
        body: companiesWithoutContact.slice(0, 2).map((c) => c.name).join(', '),
        cta: 'Contacts',
      }
    }

    if (prospectContactCount > 0) {
      return {
        href: '/dashboard/contacts',
        count: prospectContactCount,
        title: `${prospectContactCount === 1 ? 'contact' : 'contacts'} not yet reached`,
        body: 'People you know but have not yet connected with in this search.',
        cta: 'Outreach draft',
      }
    }

    if (companiesWithoutBrief.length > 0) {
      return {
        href: '/dashboard',
        count: companiesWithoutBrief.length,
        title: `${companiesWithoutBrief.length === 1 ? 'company' : 'companies'} with no prep brief`,
        body: companiesWithoutBrief.slice(0, 2).map((c) => c.name).join(', '),
        cta: 'Prep brief',
      }
    }

    return null
  })()

  return (
    <>
      {profileScore < 100 && (
        <Link
          href={profileHref}
          className="mb-6 rounded border border-white/15 bg-white/5 p-5 flex items-center gap-5 hover:border-white/35 transition-colors block"
        >
          <div
            className={`text-[40px] font-bold leading-none tabular-nums shrink-0 ${
              profileScore >= 80 ? 'text-emerald-300' : profileScore >= 40 ? 'text-amber-300' : 'text-slate-300'
            }`}
          >
            {profileScore}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-slate-100">
              {profileScore >= 80
                ? 'Profile nearly complete'
                : profileScore >= 40
                  ? 'Profile in progress'
                  : 'Complete your profile to unlock better briefs'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Profile score &middot; {nextProfileSection ? `${nextProfileSection.label} is next` : 'All sections done'}
            </div>
          </div>
          <span className="text-[12px] font-semibold text-slate-300 shrink-0">
            {nextProfileSection ? nextProfileSection.label : 'Profile'}
          </span>
        </Link>
      )}

      {profileScore < 40 && (
        <section className="mb-6 bg-slate-900 rounded p-5 sm:p-6">
          <h2 className="text-[13px] font-semibold text-orange-500 mb-1">Quick start</h2>
          <p className="text-[13px] text-slate-300 mb-4">3 fields. Unlocks your first prep brief in under 3 minutes.</p>
          <form action={onSaveQuickProfile} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                name="full_name"
                type="text"
                required
                defaultValue={quickProfileDefaults.fullName}
                placeholder="Your full name"
                className="w-full border border-slate-700 rounded px-3 py-2.5 text-[14px] text-white bg-slate-800 placeholder:text-slate-500 focus:outline-none focus:border-slate-500"
              />
              <input
                name="current_title"
                type="text"
                defaultValue={quickProfileDefaults.currentTitle}
                placeholder="Current or most recent title"
                className="w-full border border-slate-700 rounded px-3 py-2.5 text-[14px] text-white bg-slate-800 placeholder:text-slate-500 focus:outline-none focus:border-slate-500"
              />
            </div>
            <input
              name="positioning_summary"
              type="text"
              defaultValue={quickProfileDefaults.positioningSummary}
              placeholder="One sentence: what you do and what you're targeting next"
              className="w-full border border-slate-700 rounded px-3 py-2.5 text-[14px] text-white bg-slate-800 placeholder:text-slate-500 focus:outline-none focus:border-slate-500"
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-semibold px-5 py-2 rounded transition-colors cursor-pointer border-0"
              >
                Save and continue
              </button>
              <Link href="/dashboard/profile" className="text-[12px] text-slate-400 hover:text-slate-200">
                Full profile →
              </Link>
            </div>
          </form>
        </section>
      )}

      <div id="momentum-overview" className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map(({ value, label, alert, amber, href }) => {
          const inner = (
            <>
              <div className={`text-[22px] sm:text-[28px] font-bold leading-none ${alert ? 'text-rose-300' : amber ? 'text-amber-300' : 'text-slate-100'}`}>
                {value}
              </div>
              <div className="text-[10px] text-slate-400 mt-1.5 tracking-[0.07em] uppercase">{label}</div>
            </>
          )

          return href ? (
            <Link key={label} href={href} className="bg-white/5 border border-white/15 rounded p-3 sm:p-5 hover:border-white/35 transition-colors">
              {inner}
            </Link>
          ) : (
            <div key={label} className="bg-white/5 border border-white/15 rounded p-3 sm:p-5">
              {inner}
            </div>
          )
        })}
      </div>

      {showNetworkHealth && (
        <section className="mb-6 sm:mb-8 bg-white/5 border border-white/15 rounded p-5">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-100">
              {contactCoverageCount} of {totalCount} companies have a contact
            </p>
            <p className="text-[12px] text-slate-400 mt-0.5">
              Roles at this level fill through relationships. Add contacts at your top targets.
            </p>
          </div>
          <div className="mt-3">
            <Link href="/dashboard/contacts" className="text-[12px] font-semibold text-slate-300 hover:text-white transition-colors">Contacts</Link>
          </div>
        </section>
      )}

      {totalCount >= 3 && numIntelGaps > 0 && isExecutiveMode && rankedAttentionCard && (
        <section id="attention-gaps" className="mb-6 sm:mb-8">
          <h2 className="text-[13px] font-semibold text-slate-400 mb-3">Top attention gap</h2>
          <Link href={rankedAttentionCard.href} className="bg-white/5 border border-white/15 rounded p-5 hover:border-white/35 transition-colors block">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[30px] font-bold text-slate-100 leading-none mb-1">{rankedAttentionCard.count}</div>
                <div className="text-[14px] font-semibold text-slate-100 mb-1.5">{rankedAttentionCard.title}</div>
                <div className="text-[12px] text-slate-400 leading-relaxed">{rankedAttentionCard.body}</div>
              </div>
              <span className="text-[12px] font-semibold text-slate-300 shrink-0">{rankedAttentionCard.cta}</span>
            </div>
          </Link>
        </section>
      )}

      {totalCount >= 3 && numIntelGaps > 0 && !isExecutiveMode && (
        <section id="attention-gaps" className="mb-6 sm:mb-8">
          <h2 className="text-[13px] font-semibold text-slate-400 mb-3">What needs attention</h2>
          <div className={`grid grid-cols-1 gap-3 ${numIntelGaps === 2 ? 'sm:grid-cols-2' : numIntelGaps >= 3 ? 'sm:grid-cols-3' : ''}`}>
            {companiesWithoutContact.length > 0 && (
              <Link href="/dashboard/contacts" className="bg-white/5 border border-white/15 rounded p-4 hover:border-white/35 transition-colors block">
                <div className="text-[26px] font-bold text-slate-100 leading-none mb-1">{companiesWithoutContact.length}</div>
                <div className="text-[13px] font-semibold text-slate-200 mb-1.5">
                  {companiesWithoutContact.length === 1 ? 'company' : 'companies'} with no contact
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  {companiesWithoutContact.slice(0, 2).map(c => c.name).join(', ')}
                  {companiesWithoutContact.length > 2 ? ` +${companiesWithoutContact.length - 2} more` : ''}
                </div>
                <span className="text-[11px] font-semibold text-slate-300">Contacts</span>
              </Link>
            )}

            {prospectContactCount > 0 && (
              <section className="bg-white/5 border border-white/15 rounded p-4">
                <div className="text-[26px] font-bold text-slate-100 leading-none mb-1">{prospectContactCount}</div>
                <div className="text-[13px] font-semibold text-slate-200 mb-1.5">
                  {prospectContactCount === 1 ? 'contact' : 'contacts'} not yet reached
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  People you know but have not yet connected with in this search.
                </div>
                <Link href="/dashboard/contacts" className="text-[11px] font-semibold text-slate-300 hover:text-white transition-colors">Contacts</Link>
              </section>
            )}

            {companiesWithoutBrief.length > 0 && (
              <Link href="/dashboard#pipeline" className="bg-white/5 border border-white/15 rounded p-4 hover:border-white/35 transition-colors block">
                <div className="text-[26px] font-bold text-slate-100 leading-none mb-1">{companiesWithoutBrief.length}</div>
                <div className="text-[13px] font-semibold text-slate-200 mb-1.5">
                  {companiesWithoutBrief.length === 1 ? 'company' : 'companies'} with no prep brief
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  {companiesWithoutBrief.slice(0, 2).map(c => c.name).join(', ')}
                  {companiesWithoutBrief.length > 2 ? ` +${companiesWithoutBrief.length - 2} more` : ''}
                </div>
                <span className="text-[11px] font-semibold text-slate-300">Prep brief</span>
              </Link>
            )}
          </div>
        </section>
      )}

      {opportunityRadar}
    </>
  )
}
