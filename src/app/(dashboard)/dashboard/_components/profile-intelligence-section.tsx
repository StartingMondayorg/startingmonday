import Link from 'next/link'
import { Button, Card, Input } from '@/components/ui'
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
        <Link href={profileHref} className="mb-6 block">
          <Card variant="glass" className="flex-row items-center gap-5 p-5 hover:border-border transition-colors">
            <div
              className={`text-[40px] font-bold leading-none tabular-nums shrink-0 ${
                profileScore >= 80 ? 'text-success' : profileScore >= 40 ? 'text-warning' : 'text-muted-foreground'
              }`}
            >
              {profileScore}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-foreground">
                {profileScore >= 80
                  ? 'Profile nearly complete'
                  : profileScore >= 40
                    ? 'Profile in progress'
                    : 'Complete your profile to unlock better briefs'}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Profile score &middot; {nextProfileSection ? `${nextProfileSection.label} is next` : 'All sections done'}
              </div>
            </div>
            <span className="text-[12px] font-semibold text-muted-foreground shrink-0">
              {nextProfileSection ? nextProfileSection.label : 'Profile'}
            </span>
          </Card>
        </Link>
      )}

      {profileScore < 40 && (
        <Card variant="glass" className="gap-0 mb-6 p-5 sm:p-6">
          <h2 className="text-[13px] font-semibold text-primary mb-1">Quick start</h2>
          <p className="text-[13px] text-muted-foreground mb-4">3 fields. Unlocks your first prep brief in under 3 minutes.</p>
          <form action={onSaveQuickProfile} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                name="full_name"
                type="text"
                required
                defaultValue={quickProfileDefaults.fullName}
                placeholder="Your full name"
                className="h-auto w-full border-border px-3 py-2.5 text-[14px] text-foreground bg-muted placeholder:text-muted-foreground focus-visible:ring-0"
              />
              <Input
                name="current_title"
                type="text"
                defaultValue={quickProfileDefaults.currentTitle}
                placeholder="Current or most recent title"
                className="h-auto w-full border-border px-3 py-2.5 text-[14px] text-foreground bg-muted placeholder:text-muted-foreground focus-visible:ring-0"
              />
            </div>
            <Input
              name="positioning_summary"
              type="text"
              defaultValue={quickProfileDefaults.positioningSummary}
              placeholder="One sentence: what you do and what you're targeting next"
              className="h-auto w-full border-border px-3 py-2.5 text-[14px] text-foreground bg-muted placeholder:text-muted-foreground focus-visible:ring-0"
            />
            <div className="flex items-center gap-3">
              <Button type="submit" className="text-[13px] px-5 py-2 h-auto">
                Save and continue
              </Button>
              <Link href="/dashboard/profile" className="text-[12px] text-muted-foreground hover:text-foreground">
                Full profile →
              </Link>
            </div>
          </form>
        </Card>
      )}

      <div id="momentum-overview" className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map(({ value, label, alert, amber, href }) => {
          const inner = (
            <>
              <div className={`text-[22px] sm:text-[28px] font-bold leading-none ${alert ? 'text-destructive' : amber ? 'text-warning' : 'text-foreground'}`}>
                {value}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1.5 tracking-[0.07em] uppercase">{label}</div>
            </>
          )

          return href ? (
            <Link key={label} href={href} className="block">
              <Card variant="glass" className="gap-0 p-3 sm:p-5 hover:border-border transition-colors">
                {inner}
              </Card>
            </Link>
          ) : (
            <Card key={label} variant="glass" className="gap-0 p-3 sm:p-5">
              {inner}
            </Card>
          )
        })}
      </div>

      {showNetworkHealth && (
        <Card variant="glass" className="gap-0 mb-6 sm:mb-8 p-5">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground">
              {contactCoverageCount} of {totalCount} companies have a contact
            </p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Roles at this level fill through relationships. Add contacts at your top targets.
            </p>
          </div>
          <div className="mt-3">
            <Link href="/dashboard/contacts" className="text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Contacts</Link>
          </div>
        </Card>
      )}

      {totalCount >= 3 && numIntelGaps > 0 && isExecutiveMode && rankedAttentionCard && (
        <section id="attention-gaps" className="mb-6 sm:mb-8">
          <h2 className="text-[13px] font-semibold text-muted-foreground mb-3">Top attention gap</h2>
          <Link href={rankedAttentionCard.href} className="block">
            <Card variant="glass" className="p-5 hover:border-border transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[30px] font-bold text-foreground leading-none mb-1">{rankedAttentionCard.count}</div>
                  <div className="text-[14px] font-semibold text-foreground mb-1.5">{rankedAttentionCard.title}</div>
                  <div className="text-[12px] text-muted-foreground leading-relaxed">{rankedAttentionCard.body}</div>
                </div>
                <span className="text-[12px] font-semibold text-muted-foreground shrink-0">{rankedAttentionCard.cta}</span>
              </div>
            </Card>
          </Link>
        </section>
      )}

      {totalCount >= 3 && numIntelGaps > 0 && !isExecutiveMode && (
        <section id="attention-gaps" className="mb-6 sm:mb-8">
          <h2 className="text-[13px] font-semibold text-muted-foreground mb-3">What needs attention</h2>
          <div className={`grid grid-cols-1 gap-3 ${numIntelGaps === 2 ? 'sm:grid-cols-2' : numIntelGaps >= 3 ? 'sm:grid-cols-3' : ''}`}>
            {companiesWithoutContact.length > 0 && (
              <Link href="/dashboard/contacts" className="block">
                <Card variant="glass" className="gap-0 p-4 hover:border-border transition-colors">
                  <div className="text-[26px] font-bold text-foreground leading-none mb-1">{companiesWithoutContact.length}</div>
                  <div className="text-[13px] font-semibold text-foreground mb-1.5">
                    {companiesWithoutContact.length === 1 ? 'company' : 'companies'} with no contact
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                    {companiesWithoutContact.slice(0, 2).map(c => c.name).join(', ')}
                    {companiesWithoutContact.length > 2 ? ` +${companiesWithoutContact.length - 2} more` : ''}
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground">Contacts</span>
                </Card>
              </Link>
            )}

            {prospectContactCount > 0 && (
              <Card variant="glass" className="gap-0 p-4">
                <div className="text-[26px] font-bold text-foreground leading-none mb-1">{prospectContactCount}</div>
                <div className="text-[13px] font-semibold text-foreground mb-1.5">
                  {prospectContactCount === 1 ? 'contact' : 'contacts'} not yet reached
                </div>
                <div className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                  People you know but have not yet connected with in this search.
                </div>
                <Link href="/dashboard/contacts" className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Contacts</Link>
              </Card>
            )}

            {companiesWithoutBrief.length > 0 && (
              <Link href="/dashboard#pipeline" className="block">
                <Card variant="glass" className="gap-0 p-4 hover:border-border transition-colors">
                  <div className="text-[26px] font-bold text-foreground leading-none mb-1">{companiesWithoutBrief.length}</div>
                  <div className="text-[13px] font-semibold text-foreground mb-1.5">
                    {companiesWithoutBrief.length === 1 ? 'company' : 'companies'} with no prep brief
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                    {companiesWithoutBrief.slice(0, 2).map(c => c.name).join(', ')}
                    {companiesWithoutBrief.length > 2 ? ` +${companiesWithoutBrief.length - 2} more` : ''}
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground">Prep brief</span>
                </Card>
              </Link>
            )}
          </div>
        </section>
      )}

      {opportunityRadar}
    </>
  )
}
