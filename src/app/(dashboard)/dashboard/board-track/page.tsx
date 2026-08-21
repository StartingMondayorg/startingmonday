import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { LIFECYCLE_TEMPLATES } from '@/lib/executive-lifecycle'
import { Alert, AlertDescription, Card, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea } from '@/components/ui'
export const metadata: Metadata = {
  title: 'Board & Governance Track | Starting Monday',
  description: 'Board narrative, governance thesis, committee-fit preparation, and long-horizon relationship cadence.',
}

/**
 * Board and Governance Workflow Pack - Sprint ITS-3 Ticket 20
 *
 * AC: board/governance route and artifact pack published
 */
export default async function BoardGovernancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('user_id', user.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const template = LIFECYCLE_TEMPLATES.find(
    (t) => t.state === 'board_track' && t.persona === 'board_governance',
  )!

  const GOVERNANCE_THESIS_PROMPTS = [
    { label: 'My operating edge as a director', placeholder: 'e.g. I bring PE-side operating credibility and have scaled teams through three transitions.' },
    { label: 'Committee fit (where I add the most value)', placeholder: 'e.g. Audit (financial controls background) and Comp (people-cost optimization).' },
    { label: 'Governance narrative (why I am ready for a board seat now)', placeholder: 'e.g. I have operated at scale alongside two boards. I understand what good governance looks like from the operator side.' },
    { label: 'Risk posture (what I ask hard questions about)', placeholder: 'e.g. I push on technology risk, executive succession, and capital allocation discipline.' },
  ]

  const RELATIONSHIP_TIERS = [
    { tier: 'Tier 1 (monthly)', description: 'Directors or board chairs who know your work and could sponsor a nomination' },
    { tier: 'Tier 2 (quarterly)', description: 'PE partners, institutional investors, or senior executives who influence board composition' },
    { tier: 'Tier 3 (bi-annual)', description: 'Search professionals and governance advisors who place independent directors' },
  ]

  return (
    <div className="min-h-screen bg-card/85 font-sans text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] font-semibold text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <nav className="flex items-center gap-4 text-[13px] text-muted-foreground">
            <Link href="/dashboard/optionality" className="hover:text-foreground transition-colors">Optionality</Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        {/* Header */}
        <Card variant="glass" className="gap-0 px-6 py-6 shadow-xl">
          <p className="text-[13px] font-semibold text-primary mb-2">
            Board &amp; Governance Track
          </p>
          <h1 className="text-[26px] font-bold text-foreground leading-tight">
            {firstName}&apos;s board pursuit workflow
          </h1>
          <p className="text-[14px] text-foreground mt-2 max-w-xl leading-relaxed">
            Board seats are built over quarters, not weeks. The goal is narrative consistency, relationship compounding, and patient signal monitoring.
          </p>
        </Card>

        {/* Governance thesis builder */}
        <Card variant="glass" className="gap-4 px-5 py-5 shadow-xl">
          <h2 className="text-[13px] font-bold text-foreground">Governance thesis</h2>
          <p className="text-[13px] text-muted-foreground">
            Articulate your unique value as a director - not what you have done as an operator, but what you bring to a governance context.
          </p>
          {GOVERNANCE_THESIS_PROMPTS.map(({ label, placeholder }) => (
            <div key={label}>
              <Label className="block text-[13px] font-semibold text-muted-foreground mb-1">{label}</Label>
              <Textarea
                rows={2}
                placeholder={placeholder}
                className="w-full rounded-lg border-border px-3 py-2 text-[13px] text-foreground bg-background/70 placeholder:text-muted-foreground focus-visible:ring-0 resize-none"
              />
            </div>
          ))}
        </Card>

        {/* Board composition watchlist */}
        <Card variant="glass" className="gap-3 px-5 py-5 shadow-xl">
          <h2 className="text-[13px] font-bold text-foreground">Board composition watchlist</h2>
          <p className="text-[13px] text-muted-foreground">
            Track target companies where the board composition is aging, lacks your functional profile, or has a term expiry coming up.
          </p>
          <div className="rounded-lg border border-border overflow-hidden bg-background/30">
            <Table className="text-[13px]">
              <TableHeader className="bg-muted/40 [&_tr]:border-border">
                <TableRow className="hover:bg-transparent">
                  {['Company', 'Board gap you fill', 'Next inflection signal', 'Relationship in', 'Warmth'].map((h) => (
                    <TableHead key={h} className="px-3 py-2 text-[13px] font-semibold text-muted-foreground">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {[...Array(4)].map((_, i) => (
                  <TableRow key={i} className="bg-background/30 border-border">
                    <TableCell className="px-3 py-2 whitespace-normal"><Input className="h-auto w-full border-0 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:ring-0" placeholder="Company name" /></TableCell>
                    <TableCell className="px-3 py-2 whitespace-normal"><Input className="h-auto w-full border-0 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:ring-0" placeholder="e.g. Technology risk" /></TableCell>
                    <TableCell className="px-3 py-2 whitespace-normal"><Input className="h-auto w-full border-0 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:ring-0" placeholder="e.g. IPO in 18 months" /></TableCell>
                    <TableCell className="px-3 py-2 whitespace-normal"><Input className="h-auto w-full border-0 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:ring-0" placeholder="e.g. via John S." /></TableCell>
                    <TableCell className="px-3 py-2 whitespace-normal">
                      <Select defaultValue="Cold">
                        <SelectTrigger aria-label="Relationship warmth" className="border-border bg-background/70 px-2 py-1 text-[13px] text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cold">Cold</SelectItem>
                          <SelectItem value="Warm">Warm</SelectItem>
                          <SelectItem value="Hot">Hot</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Relationship cadence tiers */}
        <Card variant="glass" className="gap-4 px-5 py-5 shadow-xl">
          <h2 className="text-[13px] font-bold text-foreground">Relationship cadence</h2>
          <div className="space-y-3">
            {RELATIONSHIP_TIERS.map(({ tier, description }) => (
              <div key={tier} className="rounded-lg border border-border bg-background/30 px-4 py-3">
                <p className="text-[13px] font-bold text-foreground">{tier}</p>
                <p className="text-[13px] text-muted-foreground mt-0.5 mb-2">{description}</p>
                <Textarea
                  rows={2}
                  placeholder="List names and last-touched date..."
                  className="w-full rounded border-border px-3 py-2 text-[13px] text-foreground bg-background/70 placeholder:text-muted-foreground focus-visible:ring-0 resize-none"
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Session prompts */}
        <Card variant="glass" className="gap-0 px-5 py-5 shadow-xl">
          <h2 className="text-[13px] font-bold text-foreground mb-3">Coach session opening prompts</h2>
          <ul className="space-y-2">
            {template.sessionOpeningPrompts.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[13px] text-muted-foreground italic">
                <span className="text-muted-foreground not-italic flex-shrink-0">?</span>
                {p}
              </li>
            ))}
          </ul>
        </Card>

        {/* Positioning guidance */}
        <Alert variant="info" className="px-5 py-4">
          <AlertDescription className="text-current">
            <p className="text-[13px] font-semibold text-info mb-2">External positioning</p>
            <p className="text-[13px] text-info leading-relaxed">{template.positioningGuidance}</p>
          </AlertDescription>
        </Alert>
      </main>
    </div>
  )
}
