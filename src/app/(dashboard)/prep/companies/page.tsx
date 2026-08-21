'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, Input, Label, Textarea } from '@/components/ui'
interface Company {
  id: string
  name: string
  industry?: string
}

interface WeeklyPlan {
  featured_company_ids: string[]
}

export default function CompaniesPrepPage() {
  const supabase = createClient()
  const [featuredCompanies, setFeaturedCompanies] = useState<Company[]>([])
  const [customCompanies, setCustomCompanies] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Load this week's plan to get featured companies
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
        const weekStartStr = weekStart.toISOString().split('T')[0]

        const { data: planData } = await supabase
          .from('dashboard_weekly_plans')
          .select('featured_company_ids')
          .eq('user_id', user.id)
          .eq('week_start', weekStartStr)
          .single()

        if (planData && planData?.featured_company_ids?.length > 0) {
          const { data: companyData } = await supabase
            .from('companies')
            .select('id, name, industry')
            .in('id', planData.featured_company_ids)

          setFeaturedCompanies(companyData || [])
        }
      } catch (error) {
        console.error('Error loading companies prep:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-[32px] font-bold tracking-tight text-foreground sm:text-[40px]">
          Target Companies
        </h1>
        <p className="text-[16px] leading-relaxed text-muted-foreground max-w-2xl">
          Review this week's featured companies and confirm your broader target list.
        </p>
      </div>

      {/* Research insight card */}
      <Card className="border-primary/30 bg-primary/5 p-6 sm:p-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-primary mb-3">
          From coaching research
        </p>
        <p className="text-[15px] leading-relaxed text-foreground">
          "The leaders who closed offers fastest spent the first 4-5 weeks researching: 40-60 target companies, signals that precede a search, and the pattern of demand. They didn't rush into outreach. They moved when the pattern was clear."
        </p>
      </Card>

      {/* Featured companies section */}
      {!loading && featuredCompanies.length > 0 && (
        <Card className="border-success/30 bg-success/5 p-6 sm:p-8">
          <div className="mb-4">
            <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-success mb-2">
              ✓ Featured companies for this week ({featuredCompanies.length})
            </p>
            <p className="text-[13px] text-muted-foreground">
              Based on signals and alignment with your search. Consider these as priority targets.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {featuredCompanies.map((company) => (
              <Card
                key={company.id}
                className="px-4 py-3 border-success/30 bg-success/40 flex-row items-start justify-between"
              >
                <div>
                  <p className="font-semibold text-[14px] text-success">{company.name}</p>
                  {company.industry && <p className="text-[12px] text-success">{company.industry}</p>}
                </div>
                <Link
                  href={`/dashboard/companies/${company.id}`}
                  className="text-[11px] text-success whitespace-nowrap ml-2"
                >
                  View →
                </Link>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Form sections */}
      <form className="space-y-8">
        {/* Market research */}
        <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
            Market Research
          </p>

          <div>
            <Label htmlFor="market-focus" className="block text-[13px] font-semibold text-foreground mb-2">
              Markets or verticals you're targeting
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              E.g., "Fintech for SMB", "Enterprise AI infrastructure", "Healthcare SaaS"
            </p>
            <Textarea
              id="market-focus"
              placeholder="Your market focus or verticals..."
              rows={3}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>

          <div>
            <Label htmlFor="market-dynamics" className="block text-[13px] font-semibold text-foreground mb-2">
              What's happening in these markets right now?
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              Consolidation, new entrants, talent wars, funding shifts?
            </p>
            <Textarea
              id="market-dynamics"
              placeholder="Market trends, consolidation, funding activity, talent dynamics..."
              rows={4}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>
        </Card>

        {/* Target companies */}
        <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
            Your Full Target List
          </p>

          <div>
            <Label htmlFor="company-list" className="block text-[13px] font-semibold text-foreground mb-2">
              Add companies beyond this week's featured list
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              Build your 40-60 target company list. One per line or comma-separated. Include the featured companies above plus any others you're tracking.
            </p>
            <Textarea
              id="company-list"
              placeholder="Add more companies:&#10;Notion&#10;Monday.com&#10;Asana&#10;Or: Company1, Company2, Company3"
              rows={8}
              value={customCompanies}
              onChange={(e) => setCustomCompanies(e.target.value)}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground font-mono text-[12px] focus-visible:border-primary/50"
            />
          </div>

          <div>
            <Label htmlFor="company-criteria" className="block text-[13px] font-semibold text-foreground mb-2">
              Selection criteria
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              Why you picked these companies. Size, growth rate, geography, industry?
            </p>
            <Textarea
              id="company-criteria"
              placeholder="Company size, funding stage, growth rate, industry factors..."
              rows={3}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>
        </Card>

        {/* Signals */}
        <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
            Signals You're Watching For
          </p>

          <div>
            <Label htmlFor="key-signals" className="block text-[13px] font-semibold text-foreground mb-2">
              What precedes a search in your market?
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              Executive departures, board changes, funding announcements, product launches?
            </p>
            <Textarea
              id="key-signals"
              placeholder="E.g., executive departures, funding rounds, board changes, product announcements, acquisition activity..."
              rows={4}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>

          <div>
            <Label htmlFor="signal-sources" className="block text-[13px] font-semibold text-foreground mb-2">
              Where you'll find these signals
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              News feeds, LinkedIn, company career pages, press releases, your network?
            </p>
            <Textarea
              id="signal-sources"
              placeholder="News sources, LinkedIn updates, press releases, career pages, your network..."
              rows={3}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>
        </Card>

        {/* Outreach readiness */}
        <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
            Outreach Readiness
          </p>

          <div>
            <Label htmlFor="outreach-timing" className="block text-[13px] font-semibold text-foreground mb-2">
              When will you start outreach?
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              After weeks of company research and signal-watching.
            </p>
            <Input
              id="outreach-timing"
              type="date"
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>

          <div>
            <Label htmlFor="outreach-channels" className="block text-[13px] font-semibold text-foreground mb-2">
              Your outreach channels
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              LinkedIn, email, referrals, recruiters, network connections?
            </p>
            <Textarea
              id="outreach-channels"
              placeholder="Primary channels: LinkedIn, email, recruiters, referrals, warm introductions..."
              rows={2}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            className="border-border text-muted-foreground hover:text-foreground"
          >
            Save as draft
          </Button>
          <Button type="submit">
            Save companies research
          </Button>
        </div>
      </form>

      {/* Next steps */}
      <Card className="border-border bg-card/40 p-6 sm:p-8">
        <p className="text-[13px] font-semibold text-muted-foreground mb-3">Next: Plan your conversation flow</p>
        <p className="text-[14px] leading-relaxed text-foreground mb-4">
          With your target list confirmed, plan how you'll move from introduction through offer. Meetings Prep will walk you through each conversation phase.
        </p>
        <Button variant="link" className="px-0" render={<Link href="/prep/meetings" />}>
          Plan your meetings →
        </Button>
      </Card>
    </div>
  )
}
