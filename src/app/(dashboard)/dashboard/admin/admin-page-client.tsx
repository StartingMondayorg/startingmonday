'use client'

import Link from 'next/link'
import { FunnelChart, EventVolumeChart } from './admin-charts'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Alert, AlertDescription, AlertTitle, Badge, Card, Progress, Table, TableBody, TableCell, TableRow } from '@/components/ui'
type ScoreStatus = 'green' | 'yellow' | 'red' | 'gray'
type PageGroup = {
  id: string
  label: string
  purpose: string
  pages: Array<{ path: string; label: string; owner: string; admin: string; viewer: string; priority: 'core' | 'advanced' }>
}

type AdminPageProps = {
  userEmail: string | null | undefined
  staffRole: string
  pages: PageGroup[]
  activeUserCount: number
  usersWithCompany24h: number
  usersWithContact24h: number
  usersWithFollowUp24h: number
  usersWithBriefingView24h: number
  openAutomationAlerts: number
  searchPaused7d: number
  searchResumed7d: number
  netPaused7d: number
  pauseResumeRatio7d: string | null
  telemetryAlertLevel: 'normal' | 'watch' | 'risk'
  pauseResumeTrend7d: Array<{ dayKey: string; label: string; paused: number; resumed: number; net: number }>
  trendPeak: number
  netPausedLast3d: number
  positiveNetDaysLast3d: number
  scoreRows: Array<{ label: string; threshold: string; value: string; status: ScoreStatus; note?: string }>
  decision: { label: 'GO' | 'CONDITIONAL GO' | 'NO-GO'; status: ScoreStatus; reason: string }
  totalUsers: number
  paidUsers: number
  trialingUsers: number
  placements: Array<{ full_name: string | null; placement_company: string | null; placed_at: string | null }>
  briefingConfiguredProfilesCount: number
  briefingStale: boolean
  briefingHoursAgo: number | null
  teamMembers: Array<{ id: string; email: string; role: string }>
  internalApis: Array<{ path: string; label: string; owner: string; admin: string; viewer: string }>
  funnelData: Array<{ step: string; label: string; count: number }>
  denominator: number
  eventVolumeData: Array<{ event_name: string; count: number }>
  eventCounts7d: Record<string, number>
  linkedInAdsGatePass: boolean
  linkedInAdsDecision: string
  linkedInAdsThreshold: number
  conversionRate: number | null
  totalEnded: number
  totalConverted: number
  channelRows: Array<{ channel: string; ended: number; converted: number; rate: number }>
  trialUsers: Array<{ id: string; email: string; trial_ends_at: string | null; created_at: string | null; signup_source: string | null }>
  trialCompanySet: Set<string>
  signalRows: Array<{ type: string; label: string; total: number; acted: number; rate: number }>
  logsLength: number
  avgContextScore: number | null
  pctResume: number | null
  pctScan: number | null
  pctContacts: number | null
  avgWords: number | null
  partners: Array<{ id: string; name: string; email: string; referral_code: string; commission_pct: number }>
  attributionsByPartner: Record<string, { total: number; active: number; mrr: number }>
  b2bAccounts: Array<{ id: string; email: string; tier: string; total: number; accepted: number }>
}

function roleBadgeVariant(role: string): 'warning' | 'info' | 'secondary' {
  if (role === 'owner') return 'warning'
  if (role === 'admin') return 'info'
  return 'secondary'
}

function statusBadgeVariant(status: ScoreStatus): 'success' | 'warning' | 'destructive' | 'secondary' {
  if (status === 'green') return 'success'
  if (status === 'yellow') return 'warning'
  if (status === 'red') return 'destructive'
  return 'secondary'
}

function alertLevelBadgeVariant(level: 'normal' | 'watch' | 'risk'): 'success' | 'warning' | 'destructive' {
  if (level === 'risk') return 'destructive'
  if (level === 'watch') return 'warning'
  return 'success'
}

export function AdminPageClient(props: AdminPageProps) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground"><span className="text-foreground">Starting </span><span className="text-primary">Monday</span></span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/revenue" className="text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Revenue</Link>
            <Link href="/dashboard/admin/product" className="text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Product</Link>
            <Link href="/dashboard/admin/operations" className="text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Operations</Link>
            <Link href="/dashboard/admin/traces" className="text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Traces</Link>
            <Link href="/dashboard/admin/team" className="text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Team</Link>
            <Link href="/dashboard" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">← Dashboard</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold text-foreground leading-tight">Admin</h1>
            <p className="text-[13px] text-muted-foreground mt-1.5">
              Signed in as <span className="font-semibold">{props.userEmail ?? '-'}</span>
              <Badge variant={roleBadgeVariant(props.staffRole)} className="ml-2">{props.staffRole}</Badge>
            </p>
          </div>
        </div>

        <Card variant="glass" className="mb-8 p-4">
          <h2 className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">Jump to section</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[12px]">
            <a href="#subscriber-summary" className="text-muted-foreground hover:text-foreground underline underline-offset-2">Subscribers</a>
            <a href="#system-health" className="text-muted-foreground hover:text-foreground underline underline-offset-2">System health</a>
            <a href="#internal-pages" className="text-muted-foreground hover:text-foreground underline underline-offset-2">Internal pages</a>
            <a href="#partners" className="text-muted-foreground hover:text-foreground underline underline-offset-2">Partners</a>
          </div>
        </Card>

        <div className="mb-8">
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Operating Areas</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {props.pages.map((group) => {
              const corePages = group.pages.filter((page) => page.priority === 'core')
              const advancedCount = group.pages.filter((page) => page.priority === 'advanced').length
              return (
                <Card key={group.id} variant="glass" className="p-4">
                  <p className="text-[14px] font-bold text-foreground">{group.label}</p>
                  <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{group.purpose}</p>
                  <div className="mt-3 space-y-1.5">
                    {corePages.map((page) => <Link key={page.path} href={page.path} className="block text-[12px] font-semibold text-muted-foreground hover:text-foreground hover:underline">{page.label}</Link>)}
                    {advancedCount > 0 && <p className="text-[11px] text-muted-foreground mt-2">+ {advancedCount} advanced pages</p>}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        <div className="mb-8">
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Daily activation snapshot (24h)</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            {[
              { label: 'New users', value: 0 },
              { label: 'Added company', value: props.usersWithCompany24h },
              { label: 'Added contact', value: props.usersWithContact24h },
              { label: 'Set follow-up', value: props.usersWithFollowUp24h },
              { label: 'Viewed briefing', value: props.usersWithBriefingView24h },
            ].map((card) => (
              <Card key={card.label} variant="glass" className="p-4">
                <div className="text-[24px] font-bold text-foreground leading-none">{card.value}</div>
                <div className="text-[10px] text-muted-foreground mt-1.5 tracking-[0.07em] uppercase">{card.label}</div>
              </Card>
            ))}
          </div>
          <div className="mt-3">
            <Link href="/guide" className="inline-flex items-center gap-2 text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
              Automation alerts open: <span className="text-foreground">{props.openAutomationAlerts}</span> - view runbooks
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Search control telemetry (7d)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Paused events', value: props.searchPaused7d },
              { label: 'Resumed events', value: props.searchResumed7d },
              { label: 'Net paused', value: props.netPaused7d },
              { label: 'Pause/Resume ratio', value: props.pauseResumeRatio7d ?? 'N/A' },
            ].map((card) => (
              <Card key={card.label} variant="glass" className="p-4">
                <div className="text-[24px] font-bold text-foreground leading-none">{card.value}</div>
                <div className="text-[10px] text-muted-foreground mt-1.5 tracking-[0.07em] uppercase">{card.label}</div>
              </Card>
            ))}
          </div>
          <Card variant="glass" className="mt-4 p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Daily trend</p>
              <Badge variant={alertLevelBadgeVariant(props.telemetryAlertLevel)}>
                {props.telemetryAlertLevel === 'risk' ? 'At risk' : props.telemetryAlertLevel === 'watch' ? 'Watch' : 'Healthy'}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">Last 3d net: <span className="font-semibold text-foreground">{props.netPausedLast3d > 0 ? `+${props.netPausedLast3d}` : props.netPausedLast3d}</span> ({props.positiveNetDaysLast3d}/3 days net positive)</p>
            <div className="space-y-2">
              {props.pauseResumeTrend7d.map((row) => (
                <div key={row.dayKey} className="grid grid-cols-[84px_1fr_44px] items-center gap-3 text-[11px]">
                  <span className="text-muted-foreground">{row.label}</span>
                  <div className="grid grid-cols-2 gap-2">
                    <Progress value={row.paused} max={props.trendPeak} className="w-full" />
                    <Progress value={row.resumed} max={props.trendPeak} className="w-full" />
                  </div>
                  <span className={`text-right font-semibold ${row.net > 0 ? 'text-warning' : row.net < 0 ? 'text-success' : 'text-muted-foreground'}`}>{row.net > 0 ? `+${row.net}` : row.net}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card variant="glass" id="go-no-go" className="p-6 mb-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div><h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Go/No-Go Scorecard</h2><p className="text-[12px] text-muted-foreground mt-1">Auto-evaluated from current measurable thresholds.</p></div>
            <Badge variant={statusBadgeVariant(props.decision.status)} className="text-[12px] px-3 py-1.5">{props.decision.label}</Badge>
          </div>
          <p className="text-[12px] text-muted-foreground mb-4">{props.decision.reason}</p>
          <div className="space-y-2">
            {props.scoreRows.map((row) => (
              <div key={row.label} className="border border-border rounded px-4 py-3 bg-muted/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{row.label}</p>
                    <p className="text-[11px] text-muted-foreground">Threshold: {row.threshold}</p>
                  </div>
                  <Badge variant={statusBadgeVariant(row.status)} className="shrink-0">{row.value}</Badge>
                </div>
                {row.note && <p className="text-[11px] text-muted-foreground mt-1.5">{row.note}</p>}
              </div>
            ))}
          </div>
        </Card>

        <section id="subscriber-summary" className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[{ label: 'Total users', value: props.totalUsers }, { label: 'Active (paid)', value: props.paidUsers }, { label: 'Trialing', value: props.trialingUsers }, { label: 'Placed', value: props.placements.length }].map(({ label, value }) => (
            <Card key={label} variant="glass" className="p-5">
              <div className="text-[28px] font-bold text-foreground">{value}</div>
              <div className="text-[12px] text-muted-foreground mt-1">{label}</div>
            </Card>
          ))}
        </section>

        <Card variant="glass" id="system-health" className="p-5 mb-6">
          <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-3">System Health</div>
          <div className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${props.briefingStale ? 'bg-destructive' : props.briefingConfiguredProfilesCount === 0 ? 'bg-muted' : 'bg-success'}`} />
            <span className="text-[13px] text-foreground">Briefing worker {props.briefingConfiguredProfilesCount === 0 ? '-- no users configured' : props.briefingHoursAgo !== null ? `-- last sent ${props.briefingHoursAgo}h ago` : '-- never sent'}</span>
            {props.briefingStale && <Badge variant="destructive">STALE</Badge>}
          </div>
        </Card>

        <Card variant="glass" id="team-summary" className="p-0 mb-6">
          <div className="px-6 py-[18px] border-b border-border flex items-center justify-between">
            <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Team</h2>
          </div>
          <div className="divide-y divide-border">
            {props.teamMembers.map(m => (
              <div key={m.id} className="px-6 py-3 flex items-center justify-between">
                <span className="text-[13px] text-foreground">{m.email}</span>
                <Badge variant={roleBadgeVariant(m.role)}>{m.role}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Accordion id="internal-pages" className="mb-6">
          <AccordionItem value="internal-pages" className="border-b-0">
            <AccordionTrigger className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground hover:no-underline">
              Internal pages + permissions
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {props.pages.map((group) => (
                  <Card key={group.id} variant="glass" className="p-0">
                    <div className="px-6 py-[18px] border-b border-border flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">{group.label}</span>
                        <p className="text-[12px] text-muted-foreground mt-1">{group.purpose}</p>
                      </div>
                      <span className="text-[11px] text-muted-foreground">{group.pages.length} pages</span>
                    </div>
                    <Table className="text-[12px]">
                      <TableBody className="divide-y divide-border">
                        {group.pages.map((page, i) => (
                          <TableRow key={`${group.id}-${i}`} className="border-0 hover:bg-transparent">
                            <TableCell className="px-6 py-3 whitespace-normal">
                              <Link href={page.path} className="text-muted-foreground font-semibold hover:text-foreground">{page.label}</Link>
                              <span className="ml-2 text-muted-foreground font-mono text-[11px]">{page.path}</span>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-center font-bold text-warning">{page.owner}</TableCell>
                            <TableCell className="px-4 py-3 text-center font-bold text-info">{page.admin}</TableCell>
                            <TableCell className="px-4 py-3 text-center text-muted-foreground">{page.viewer}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Card variant="glass" id="internal-apis" className="p-0 mb-6">
          <Accordion>
            <AccordionItem value="internal-apis" className="border-b-0">
              <AccordionTrigger className="px-6 py-[18px] text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground hover:no-underline">
                Internal APIs + permissions
              </AccordionTrigger>
              <AccordionContent className="pt-0">
                <Table className="text-[12px]">
                  <TableBody className="divide-y divide-border">
                    {props.internalApis.map((p, i) => (
                      <TableRow key={i} className="border-0 hover:bg-transparent">
                        <TableCell className="px-6 py-3">
                          <span className="text-foreground font-semibold">{p.label}</span>
                          <span className="ml-2 text-muted-foreground font-mono text-[11px]">{p.path}</span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center font-bold text-warning">{p.owner}</TableCell>
                        <TableCell className="px-4 py-3 text-center font-bold text-info">{p.admin}</TableCell>
                        <TableCell className="px-4 py-3 text-center text-muted-foreground">{p.viewer}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        <Card variant="glass" id="six-actions-funnel" className="p-6 mb-6">
          <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-1">Six-Actions Funnel</h2>
          <p className="text-[12px] text-muted-foreground mb-6">Trialing + active users (n={props.activeUserCount})</p>
          <FunnelChart data={props.funnelData} />
        </Card>

        <Card variant="glass" id="event-volume" className="p-6 mb-6">
          <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-1">Event Volume (30d)</h2>
          <p className="text-[12px] text-muted-foreground mb-6">7d counts in right column</p>
          <EventVolumeChart data={props.eventVolumeData} />
        </Card>

        <Card variant="glass" id="trial-conversion" className="p-6 mb-6">
          <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-1">Trial Conversion</h2>
          <p className="text-[12px] text-muted-foreground mb-5">Users whose 30-day trial window has closed</p>
          <Alert variant={props.linkedInAdsGatePass ? 'success' : 'warning'} className="mb-5 block">
            <div className="flex items-center justify-between gap-3 mb-1">
              <AlertTitle className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground">LinkedIn Ads Gate</AlertTitle>
              <Badge variant={props.linkedInAdsGatePass ? 'success' : 'warning'}>{props.linkedInAdsDecision}</Badge>
            </div>
            <AlertDescription className="text-[12px] text-muted-foreground">Requires trial-to-paid conversion of at least {props.linkedInAdsThreshold}%. Current: {props.conversionRate !== null ? `${props.conversionRate}%` : 'N/A'}.</AlertDescription>
          </Alert>
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div><div className="text-[28px] font-bold text-foreground">{props.totalEnded}</div><div className="text-[12px] text-muted-foreground mt-1">Trials ended</div></div>
            <div><div className="text-[28px] font-bold text-foreground">{props.totalConverted}</div><div className="text-[12px] text-muted-foreground mt-1">Converted to paid</div></div>
            <div><div className="text-[28px] font-bold text-foreground">{props.conversionRate !== null ? `${props.conversionRate}%` : '-'}</div><div className="text-[12px] text-muted-foreground mt-1">Conversion rate</div></div>
          </div>
        </Card>

        <Card variant="glass" id="active-trials" className="p-0 mb-6">
          <Accordion>
            <AccordionItem value="active-trials" className="border-b-0">
              <AccordionTrigger className="px-6 py-[18px] text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground hover:no-underline">
                Active Trials ({props.trialUsers.length})
              </AccordionTrigger>
              <AccordionContent className="pt-0">
                {props.trialUsers.length === 0 ? <p className="px-6 py-5 text-[13px] text-muted-foreground">No active trials.</p> : null}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        <Card variant="glass" id="signal-action-rate" className="p-6 mb-6">
          <Accordion>
            <AccordionItem value="signal-action-rate" className="border-b-0">
              <AccordionTrigger className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground hover:no-underline">
                Signal &rarr; Action Rate
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4">
                  <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-1">Signal {'->'} Action Rate</h2>
                  <p className="text-[12px] text-muted-foreground mb-5">Signals that triggered outreach, brief gen, or contact add within 48h</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        <Card variant="glass" id="partners" className="p-0 mb-6">
          <Accordion>
            <AccordionItem value="partners" className="border-b-0">
              <AccordionTrigger className="px-6 py-[18px] text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground hover:no-underline">
                Partners ({props.partners.length})
              </AccordionTrigger>
              <AccordionContent className="pt-0">
                {props.partners.length === 0 ? <p className="px-6 py-5 text-[13px] text-muted-foreground">No partners yet.</p> : null}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        {props.b2bAccounts.length > 0 && (
          <Card variant="glass" id="b2b-accounts" className="p-0 mb-6">
            <Accordion>
              <AccordionItem value="b2b-accounts" className="border-b-0">
                <AccordionTrigger className="px-6 py-[18px] text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground hover:no-underline">
                  B2B Accounts ({props.b2bAccounts.length})
                </AccordionTrigger>
                <AccordionContent className="pt-0" />
              </AccordionItem>
            </Accordion>
          </Card>
        )}
        {props.placements.length > 0 && (
          <Card variant="glass" id="placements" className="p-0 mb-6">
            <Accordion>
              <AccordionItem value="placements" className="border-b-0">
                <AccordionTrigger className="px-6 py-[18px] text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground hover:no-underline">
                  Placements ({props.placements.length})
                </AccordionTrigger>
                <AccordionContent className="pt-0" />
              </AccordionItem>
            </Accordion>
          </Card>
        )}

        <Card variant="glass" id="brief-quality" className="p-6">
          <Accordion>
            <AccordionItem value="brief-quality" className="border-b-0">
              <AccordionTrigger className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground hover:no-underline">
                Brief Quality (30d)
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4">
                  <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-1">Brief Quality (30d)</h2>
                  <p className="text-[12px] text-muted-foreground mb-5">Context richness at generation time (n={props.logsLength})</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-5">
                    <div><div className="text-[22px] font-bold text-foreground">{props.avgContextScore !== null ? `${props.avgContextScore}/100` : '-'}</div><div className="text-[11px] text-muted-foreground mt-1 leading-snug">Avg context score</div></div>
                    <div><div className="text-[22px] font-bold text-foreground">{props.pctResume !== null ? `${props.pctResume}%` : '-'}</div><div className="text-[11px] text-muted-foreground mt-1 leading-snug">% with resume</div></div>
                    <div><div className="text-[22px] font-bold text-foreground">{props.pctScan !== null ? `${props.pctScan}%` : '-'}</div><div className="text-[11px] text-muted-foreground mt-1 leading-snug">% with scan</div></div>
                    <div><div className="text-[22px] font-bold text-foreground">{props.pctContacts !== null ? `${props.pctContacts}%` : '-'}</div><div className="text-[11px] text-muted-foreground mt-1 leading-snug">% with contacts</div></div>
                    <div><div className="text-[22px] font-bold text-foreground">{props.avgWords !== null ? props.avgWords.toLocaleString() : '-'}</div><div className="text-[11px] text-muted-foreground mt-1 leading-snug">Avg word count</div></div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </main>
    </div>
  )
}
