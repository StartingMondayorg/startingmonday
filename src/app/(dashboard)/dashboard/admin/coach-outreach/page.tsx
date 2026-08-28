/* eslint-disable react/no-unescaped-entities */
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Alert, AlertDescription, Badge, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
export const metadata: Metadata = {
  title: 'Coach Outreach - Admin',
  description: 'Internal-only executive coach outreach strategy, tracking, and messaging.',
  robots: { index: false, follow: false },
}

type FilterSet = {
  title: string
  filters: string[]
}

type OutreachStep = {
  title: string
  action: string
}

type FollowUpSequence = {
  day: number
  action: string
  condition: string
}

type MessageTemplate = {
  title: string
  context: string
  body: string[]
}

export default async function CoachOutreachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const filters: FilterSet[] = [
    {
      title: 'LinkedIn Sales Navigator Search',
      filters: [
        'Title: executive coach OR career coach OR outplacement consultant',
        'Geography: United States',
        'Company: 1-10 employees',
        'Active on LinkedIn: posted in last 30 days',
        'Connection degree: 2nd degree preferred',
        'Secondary filter: prioritize VP->CXO transition content; skip early-career content.',
      ],
    },
  ]

  const outreachSteps: OutreachStep[] = [
    {
      title: 'Step 1: Build your list',
      action: 'Run the search and add 10-15 coaches per day to a Coach Outreach list.',
    },
    {
      title: 'Step 2: Send connection request',
      action: 'Send a personalized connection note under 250 characters.',
    },
    {
      title: 'Step 3: Track status',
      action: 'Log name, LinkedIn URL, request date, note preview, and status.',
    },
    {
      title: 'Step 4: Follow up fast',
      action: 'When accepted, send same-day follow-up and offer a 15-minute walkthrough.',
    },
  ]

  const followUpSequence: FollowUpSequence[] = [
    {
      day: 0,
      action: 'Connection accepted',
      condition: 'Send follow-up same day',
    },
    {
      day: 3,
      action: 'No response to follow-up',
      condition: 'Send short demo-video option',
    },
    {
      day: 7,
      action: 'Still no response',
      condition: 'Send final close-out note, then stop',
    },
    {
      day: 0,
      action: 'They respond positively',
      condition: 'Schedule a 15-minute walkthrough within 2 business days',
    },
  ]

  const messageTemplates: MessageTemplate[] = [
    {
      title: 'Email 1 - Brand Wedge',
      context: 'Lead with the top three pain points.',
      body: [
        'Quick observation from coaching teams we speak with: clients arrive underprepared, follow-through drops between sessions, and too much paid time gets spent rebuilding context. Starting Monday gives coaches one operating loop for prep, between-session actions, and visible momentum so sessions start with decisions instead of recap. Reply yes and I will send the 14-day coach pilot checklist. Reply pass and I will close the loop.',
      ],
    },
    {
      title: 'Email 2 - Momentum Loss',
      context: 'Use after no response to the first note.',
      body: [
        'Most coaching drift happens between sessions, not in-session. When rhythm is unclear, momentum drops and coaches spend paid time recovering the same ground. Starting Monday keeps preparation, follow-through, and context continuity visible in one place across active clients. Reply yes and I will send the between-session rhythm worksheet. Reply pass and I will close the loop.',
      ],
    },
    {
      title: 'Email 3 - Moment vs System',
      context: 'Clarify micro-product relief vs app-level recurrence.',
      body: [
        'A worksheet can fix one painful session. The recurring problem is the system: prep quality, follow-through, and context continuity across weeks and clients. Starting Monday is built for that recurring layer so you can coach strategy instead of managing drift. If useful, reply yes and I will send the one-page example. Reply pass and I will close the loop.',
      ],
    },
    {
      title: 'Email 4 - Decision Close',
      context: 'Use as final close-out and explicit decision ask.',
      body: [
        'Closing the loop from my earlier notes. If this is a priority now, I can send the 14-day pilot checklist with three pass-fail metrics: prep quality before sessions, between-session follow-through, and recap time reduction. If useful, reply yes and I will send it. Reply pass and I will close the loop.',
      ],
    },
    {
      title: 'Positive Response Next Step',
      context: 'They replied yes. Move to proof quickly.',
      body: [
        'Great, I will send the 14-day coach pilot checklist and one page showing pain-to-product-to-app mapping. If useful after review, we can do a 15-minute walkthrough focused on your highest-cost pain point first.',
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard/admin" className="text-[13px] font-semibold text-foreground hover:text-primary transition-colors">
            ← Admin
          </Link>
          <h1 className="text-[18px] font-bold text-foreground">Executive Coach Outreach</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
{/* Overview */}
        <Card className="p-6">
          <h2 className="text-[18px] font-bold text-foreground">Channel Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px] text-muted-foreground leading-relaxed">
            <div>
              <p className="font-semibold text-foreground mb-1">The Target</p>
              <p>Independent executive coaches (1-10 person firms) who work with VP/CXO clients in transition.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">The Value</p>
              <p>One coach with 15 active clients on Active tier = $597/month recurring commission. No enrollment fees, no minimums.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Success Rate</p>
              <p>Target: 15-20% response rate. High NPS potential because coaches already know when executives are in motion.</p>
            </div>
          </div>
        </Card>

        {/* Sales Navigator Filters */}
        <Card className="p-6">
          <h2 className="text-[18px] font-bold text-foreground">Sales Navigator Search Filters</h2>
          <p className="text-[13px] text-muted-foreground">Use these exact filters to build your prospect list:</p>
          {filters.map((filterSet, i) => (
            <div key={i} className="border-t border-border pt-4">
              <p className="text-[14px] font-semibold text-foreground mb-3">{filterSet.title}</p>
              <ul className="space-y-2">
                {filterSet.filters.map((f, j) => (
                  <li key={j} className="flex gap-3 text-[13px] text-muted-foreground">
                    <span className="shrink-0 text-muted-foreground">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Card>

        {/* Outreach Steps */}
        <Card className="p-6">
          <h2 className="text-[18px] font-bold text-foreground">6-Step Outreach Process</h2>
          <p className="text-[13px] text-muted-foreground">Execute these steps in order. Track everything in a spreadsheet (see template below).</p>
          <div className="space-y-4 pt-4">
            {outreachSteps.map((step, i) => (
              <div key={i} className="border-l-3 border-primary/30 pl-4">
                <p className="text-[13px] font-bold text-foreground">{step.title}</p>
                <p className="text-[13px] text-muted-foreground mt-1.5">{step.action}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Follow-Up Sequence */}
        <Card className="p-6">
          <h2 className="text-[18px] font-bold text-foreground">Follow-Up Sequence & Decision Tree</h2>
          <p className="text-[13px] text-muted-foreground">Use this sequence to manage responses and non-responses:</p>
          <div className="mt-4">
            <Table className="text-[12px] text-left">
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="px-4 py-2.5 font-semibold text-foreground">Timeline</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-foreground">Event</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-foreground">Your Next Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {followUpSequence.map((seq, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-4 py-3 text-muted-foreground font-mono text-[11px] whitespace-normal">Day {seq.day}</TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground whitespace-normal">{seq.action}</TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground whitespace-normal">{seq.condition}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Message Templates */}
        <Card className="p-6">
          <h2 className="text-[18px] font-bold text-foreground">Message Templates</h2>
          <p className="text-[13px] text-muted-foreground">
            Do not use these verbatim. Personalize each message with details from their profile, recent posts, or conference talks. Generic templates get lower response rates.
          </p>
          <div className="space-y-8 pt-4">
            {messageTemplates.map((template, i) => (
              <div key={i} className="border-t border-border pt-6">
                <p className="text-[13px] font-bold tracking-[0.1em] uppercase text-primary mb-2">{template.title}</p>
                <p className="text-[12px] text-muted-foreground mb-4">{template.context}</p>
                <ul className="space-y-4">
                  {template.body.map((line, j) => (
                    <li key={j}>
                      <Card className="p-3.5 text-[13px] text-muted-foreground leading-relaxed">
                        "{line}"
                      </Card>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        {/* Tracking Setup */}
        <Card className="p-6">
          <h2 className="text-[18px] font-bold text-foreground">Lead Tracking Spreadsheet</h2>
          <p className="text-[13px] text-muted-foreground mb-4">
            Create a simple Google Sheet with these columns to track every prospect:
          </p>
          <div className="space-y-3 text-[13px] text-muted-foreground">
            <div className="flex gap-3">
              <Badge className="shrink-0 font-mono w-6 h-6 rounded-full p-0 justify-center">1</Badge>
              <div>
                <p className="font-semibold text-foreground">Coach Name</p>
                <p className="text-[12px]">First and last name</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Badge className="shrink-0 font-mono w-6 h-6 rounded-full p-0 justify-center">2</Badge>
              <div>
                <p className="font-semibold text-foreground">LinkedIn URL</p>
                <p className="text-[12px]">Link to their profile</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Badge className="shrink-0 font-mono w-6 h-6 rounded-full p-0 justify-center">3</Badge>
              <div>
                <p className="font-semibold text-foreground">Connection Request Sent</p>
                <p className="text-[12px]">Date (YYYY-MM-DD)</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Badge className="shrink-0 font-mono w-6 h-6 rounded-full p-0 justify-center">4</Badge>
              <div>
                <p className="font-semibold text-foreground">Connection Request Note</p>
                <p className="text-[12px]">First 50 characters of what you said</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Badge className="shrink-0 font-mono w-6 h-6 rounded-full p-0 justify-center">5</Badge>
              <div>
                <p className="font-semibold text-foreground">Status</p>
                <p className="text-[12px]">Pending | Connected | Responded | Demo Scheduled | Demo Completed | Passed</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Badge className="shrink-0 font-mono w-6 h-6 rounded-full p-0 justify-center">6</Badge>
              <div>
                <p className="font-semibold text-foreground">Response Date</p>
                <p className="text-[12px]">When they responded (if applicable)</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Badge className="shrink-0 font-mono w-6 h-6 rounded-full p-0 justify-center">7</Badge>
              <div>
                <p className="font-semibold text-foreground">Response Type</p>
                <p className="text-[12px]">Positive | Neutral | Declined | Silent</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Badge className="shrink-0 font-mono w-6 h-6 rounded-full p-0 justify-center">8</Badge>
              <div>
                <p className="font-semibold text-foreground">Notes</p>
                <p className="text-[12px]">What they said, follow-up needed, anything relevant</p>
              </div>
            </div>
          </div>
          <Alert className="mt-6">
            <AlertDescription className="text-[12px] text-primary leading-relaxed">
              <span className="font-semibold">Key insight:</span> Update the spreadsheet immediately after each touch. Do not rely on memory. This becomes your lead database and follow-up system.
            </AlertDescription>
          </Alert>
        </Card>

        {/* Success Metrics */}
        <Card className="p-6">
          <h2 className="text-[18px] font-bold text-foreground">Success Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="border-t border-border pt-4">
              <p className="text-[12px] font-bold text-foreground mb-1">Connection Acceptance Rate</p>
              <p className="text-[18px] font-bold text-primary">40-60%</p>
              <p className="text-[12px] text-muted-foreground mt-1">of cold connection requests should be accepted</p>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-[12px] font-bold text-foreground mb-1">Response Rate (To Follow-Up)</p>
              <p className="text-[18px] font-bold text-primary">15-20%</p>
              <p className="text-[12px] text-muted-foreground mt-1">should respond to your first follow-up message</p>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-[12px] font-bold text-foreground mb-1">Demo-to-Signup Rate</p>
              <p className="text-[18px] font-bold text-primary">25-35%</p>
              <p className="text-[12px] text-muted-foreground mt-1">should sign up after seeing a demo</p>
            </div>
          </div>
          <Alert className="mt-6">
            <AlertDescription className="text-[12px] text-muted-foreground leading-relaxed">
              <span className="font-semibold">If your response rate is below 15%:</span> The messaging is likely the issue, not the effort level. Pause new outreach, review responses from the past 10 contacts, and refine your message before continuing. Generic language and product-focused openings perform poorly.
            </AlertDescription>
            <AlertDescription className="text-[12px] text-muted-foreground leading-relaxed">
              <span className="font-semibold">Target outreach volume:</span> 10-15 new connection requests per day. This is sustainable, high-personalization outreach, not spray-and-pray.
            </AlertDescription>
          </Alert>
        </Card>

        {/* Link Strategy */}
        <Card className="border border-primary/30 bg-primary/10 p-6">
          <h2 className="text-[18px] font-bold text-primary">Should You Include Links in Outreach Messages?</h2>
          <div className="space-y-4 text-[13px] text-primary">
            <div>
              <p className="font-semibold mb-1">Short answer: No links in the cold connection request. Yes link in the accepted follow-up.</p>
            </div>
            <div className="border-t border-primary/30 pt-4">
              <p className="font-semibold mb-1">Why no link in the connection request:</p>
              <ul className="space-y-1 pl-4 list-disc text-[12px]">
                <li>LinkedIn penalizes messages with URLs as spam</li>
                <li>They have not yet decided to engage; a link feels presumptuous</li>
                <li>You want them to accept the connection first, then offer next steps</li>
              </ul>
            </div>
            <div className="border-t border-primary/30 pt-4">
              <p className="font-semibold mb-1">When to include links (in the accepted follow-up):</p>
              <ul className="space-y-1 pl-4 list-disc text-[12px]">
                <li>
                  Link to /for-coaches page: "Here's an overview of what other coaches are doing with it: <code>startingmonday.app/for-coaches</code>"
                </li>
                <li>
                  Link to a 2-min demo video (if you have one) is better than a link to a page, because it feels more personal
                </li>
                <li>Never send the partner dashboard link - it's internal only</li>
              </ul>
            </div>
            <div className="border-t border-primary/30 pt-4">
              <p className="font-semibold mb-1">Best practice:</p>
              <p className="text-[12px]">
                "Would a 15-minute demo be worth your time? I can walk through how your clients would use it, then you can reach out to your own network." This way, you're selling the demo itself, not the link. The /for-coaches page acts as backup if they ask "what is this?"
              </p>
            </div>
          </div>
        </Card>

        {/* Resources */}
        <Card className="p-6">
          <h2 className="text-[18px] font-bold text-foreground">Related Resources</h2>
          <div className="space-y-2">
            <Link href="/for-coaches" className="flex items-center gap-2 text-[13px] font-semibold text-primary transition-colors">
              Public coach landing page
              <span className="text-[10px]">→</span>
            </Link>
            <Link href="/coaches-guide" className="flex items-center gap-2 text-[13px] font-semibold text-primary transition-colors">
              Coach partner guide
              <span className="text-[10px]">→</span>
            </Link>
            <Link href="/partners" className="flex items-center gap-2 text-[13px] font-semibold text-primary transition-colors">
              General partner application
              <span className="text-[10px]">→</span>
            </Link>
            <Link href="/dashboard/partner" className="flex items-center gap-2 text-[13px] font-semibold text-primary transition-colors">
              Partner dashboard (for tracking commissions)
              <span className="text-[10px]">→</span>
            </Link>
          </div>
        </Card>

      </main>
    </div>
  )
}
