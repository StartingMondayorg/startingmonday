import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { SocialClient } from './social-client'
import { Alert, AlertDescription, Badge, Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
const PILLAR_LABELS: Record<string, string> = {
  search_craft:  'Search Craft',
  market_intel:  'Market Intelligence',
  behind_build:  'Behind the Build',
  user_story:    'User Story',
  engagement:    'Engagement',
}

function getNoteToken(notes: string | null | undefined, key: string): string | null {
  if (!notes) return null
  const prefix = `${key}=`
  const token = notes
    .split('|')
    .map(part => part.trim())
    .find(part => part.startsWith(prefix))
  if (!token) return null
  const value = token.slice(prefix.length).trim()
  return value || null
}

export default async function SocialAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const admin = createAdminClient() as any

  // Post history - last 30 days
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data: history } = await admin
    .from('social_posts')
    .select('id, post_date, pillar, is_posted, posted_at, buffer_scheduled_at, draft_text, notes')
    .gte('post_date', since30d)
    .order('post_date', { ascending: false })

  const posts = (history ?? []) as {
    id: string
    post_date: string
    pillar: string
    is_posted: boolean
    posted_at: string | null
    buffer_scheduled_at: string | null
    draft_text: string
    notes: string | null
  }[]

  const { data: googleCalendarIntegration } = await admin
    .from('google_calendar_integrations')
    .select('id, calendar_id, active, last_synced_at, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-primary-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin" className="text-[13px] font-semibold text-muted-foreground transition-colors">&larr; Admin</Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
<div className="mb-8">
          <h1 className="text-[26px] font-bold text-foreground leading-tight">LinkedIn Social</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            Daily weekday draft by audience - review, edit, copy, and mark posted.
          </p>
          <div className="mt-3">
            <Button render={<a href="#content-checker" />} variant="outline" size="sm">
              Content Checker
            </Button>
          </div>
        </div>

        <Card id="google-calendar" className="mb-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-foreground">Google Calendar sync</h2>
              <p className="text-[13px] text-muted-foreground mt-1.5 max-w-2xl">
                Connect Google Calendar to sync the posting reminder schedule directly instead of relying on manual .ics imports.
              </p>
              <p className="text-[13px] text-muted-foreground mt-1.5">
                Source calendar: <span className="font-semibold text-muted-foreground">docs/operations/reminders/startingmonday-posting-reminders.ics</span>
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-2">
              {googleCalendarIntegration?.active ? (
                <Badge variant="success">Connected</Badge>
              ) : (
                <Badge variant="secondary">Not connected</Badge>
              )}
              <div className="flex flex-wrap gap-2">
                <Button render={<a href="/api/google-calendar/connect?returnTo=/dashboard/admin/social" />}>
                  {googleCalendarIntegration?.active ? 'Reconnect' : 'Connect Google Calendar'}
                </Button>
                {googleCalendarIntegration?.active && (
                  <form action="/api/google-calendar/disconnect" method="post">
                    <input type="hidden" name="returnTo" value="/dashboard/admin/social" />
                    <Button type="submit" variant="outline">
                      Disconnect
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3 text-[13px] text-muted-foreground">
            <Card className="p-3">
              <p className="font-semibold text-foreground mb-1">Calendar</p>
              <p>{googleCalendarIntegration?.calendar_id ?? 'primary'}</p>
            </Card>
            <Card className="p-3">
              <p className="font-semibold text-foreground mb-1">Last sync</p>
              <p>{googleCalendarIntegration?.last_synced_at ? new Date(googleCalendarIntegration.last_synced_at).toLocaleString() : 'Not synced yet'}</p>
            </Card>
            <Card className="p-3">
              <p className="font-semibold text-foreground mb-1">Notes</p>
              <p>Refreshes on the cron schedule and after the first OAuth connection.</p>
            </Card>
          </div>
        </Card>

        <SocialClient />

        {/* Post history */}
        {posts.length > 0 && (
          <section id="post-history" className="mt-10">
            <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-4">Post History (30 days)</h2>
            <Card className="p-0">
              <Table className="text-[13px]">
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="px-5 py-3 font-semibold text-muted-foreground">Date</TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-muted-foreground">Pillar</TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-muted-foreground">Status</TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-muted-foreground">Council</TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Preview</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map(p => {
                    const councilPass = getNoteToken(p.notes, 'council_pass') === 'true'
                    const emotionalAngle = getNoteToken(p.notes, 'emotional_angle')

                    return (
                    <TableRow key={p.id}>
                      <TableCell className="px-5 py-3 font-semibold text-foreground whitespace-nowrap">
                        {new Date(p.post_date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {PILLAR_LABELS[p.pillar] ?? p.pillar}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {p.is_posted ? (
                          <Badge variant="success">Posted</Badge>
                        ) : p.buffer_scheduled_at ? (
                          <Badge variant="info">Queued</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <Badge variant={councilPass ? 'success' : 'destructive'} className="w-fit">
                            {councilPass ? 'Pass' : 'Fail'}
                          </Badge>
                          <span className="text-[13px] text-muted-foreground">
                            {emotionalAngle ? emotionalAngle.replace('_', ' ') : 'No angle'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground hidden sm:table-cell max-w-xs truncate">
                        {p.draft_text.split('\n')[0].slice(0, 80)}
                      </TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          </section>
        )}

        {/* Liz instructions */}
        <section id="daily-workflow" className="mt-10">
        <Card className="p-6">
          <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-4">Daily Workflow -- Monday Through Friday</h2>

          <Alert variant="info" className="mb-6 p-4">
            <AlertDescription>
              <h3 className="text-[13px] font-bold tracking-[0.08em] uppercase text-info mb-2">Executive Coach Outreach Guide For Liz</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">
                The full step-by-step guide, coach-finding criteria, and message options are in:
                {' '}
                <span className="font-mono text-foreground">docs/liz-executive-coach-linkedin-guide.md</span>
              </p>
              <p className="text-[13px] text-muted-foreground mb-2">Send-ready email draft:</p>
              <Card className="p-3 text-[13px] text-muted-foreground leading-relaxed">
                <p><span className="font-semibold text-foreground">Subject:</span> Executive coach outreach guide now live</p>
                <p className="mt-2">Hi Liz,</p>
                <p className="mt-1">
                  I published the daily executive coach outreach guide. It mirrors the Social page operating style and includes: coach-finding filters, persona criteria, objection tags, connection note options, and the 7-touch follow-up sequence.
                </p>
                <p className="mt-1">
                  Please start with this file: docs/liz-executive-coach-linkedin-guide.md
                </p>
                <p className="mt-1">Thanks, Rich</p>
              </Card>
              <Button
                render={
                  <a href="mailto:?subject=Executive%20coach%20outreach%20guide%20now%20live&body=Hi%20Liz%2C%0A%0AI%20published%20the%20daily%20executive%20coach%20outreach%20guide.%20It%20mirrors%20the%20Social%20page%20operating%20style%20and%20includes%3A%20coach-finding%20filters%2C%20persona%20criteria%2C%20objection%20tags%2C%20connection%20note%20options%2C%20and%20the%207-touch%20follow-up%20sequence.%0A%0APlease%20start%20with%20this%20file%3A%20docs%2Fliz-executive-coach-linkedin-guide.md%0A%0AThanks%2C%0ARich" />
                }
                variant="outline"
                className="mt-3"
              >
                Open email draft
              </Button>
            </AlertDescription>
          </Alert>

          <ol className="flex flex-col gap-5">
            {[
              {
                title: 'Open this page before 8:30 AM CT on post days.',
                body: 'Posts now go out every weekday with audience rotation: executives, search firms, executive coaches, and outplacement firms. The page will say "No post scheduled today" on weekends. A cron job auto-posts if you have not posted first, so open this before 8:30 AM CT if you want a manual review pass.',
              },
              {
                title: 'Read the draft carefully. Check three things.',
                body: '(a) Does it sound like Rich: direct, short sentences, no corporate filler? (b) Is it under 3,000 characters? The count appears below the text box. (c) Does it land one clear point with a sharp ending? If the draft is off, click "Regenerate" in the top-right of the date card.',
              },
              {
                title: 'Edit anything that needs fixing.',
                body: 'Click anywhere in the text box and type directly. Changes save automatically when you click somewhere else on the page - you\'ll see "Unsaved edits" in amber if a save is still pending. Do not close the tab while it says that.',
              },
              {
                title: 'Post it. Two options.',
                body: 'Option A: Click "Post to LinkedIn" - this fires immediately through the LinkedIn API. The status updates to confirm. This is the preferred method. Option B: Click "Copy to clipboard," go to linkedin.com, create a new post, paste the text, and publish it yourself. Then come back here and click "Mark posted (manual)" so the record stays accurate. Use Option B only if Option A throws an error.',
              },
              {
                title: 'Track engagement in the Notes field.',
                body: 'After the post has been live for a few hours, note: total likes, total comments, any specific people who commented (name and what they said), and anyone Rich should follow up with. Paste notable comments verbatim if they\'re worth keeping. This feeds the weekly digest and helps identify warm leads for outreach.',
              },
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-[13px] text-muted-foreground">
                <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[13px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-foreground mb-1">{step.title}</p>
                  <p className="leading-relaxed">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6 pt-5 border-t border-border">
            <h3 id="cio-outreach" className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">CIO Outreach - Accepted Connection Follow-Up</h3>
            <p className="text-[13px] text-muted-foreground mb-3">Use these when a CIO accepts the connection request. Pick one subject and one two-sentence body, then send same day.</p>
            <Card className="p-4">
              <p className="text-[13px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-2">Version A - Direct And Memorable</p>
              <p className="text-[13px] text-foreground mb-2"><span className="font-semibold">Subject:</span> Most CIO searches stall between sessions.</p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                [Name], thanks for connecting. Most CIO searches lose momentum between sessions, so we built Starting Monday to keep execution tight with company signals, prep briefs, and a live pipeline view; open to a 15-minute walkthrough?
              </p>
            </Card>
            <Card className="mt-3 p-4">
              <p className="text-[13px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-2">Version B - Relationship First</p>
              <p className="text-[13px] text-foreground mb-2"><span className="font-semibold">Subject:</span> You run strategy. We handle the between-session execution.</p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                [Name], appreciate the connection. The quiet middle of a CIO transition is where searches drift, so Starting Monday gives candidates a daily operating rhythm that keeps research, outreach, and interview prep moving; open to a short 15-minute walkthrough?
              </p>
            </Card>
            <div className="mt-3 text-[13px] text-muted-foreground leading-relaxed">
              <p><span className="font-semibold text-foreground">If no response after 3 days:</span> Happy to send a short demo video if that is easier than a live call.</p>
              <p className="mt-1"><span className="font-semibold text-foreground">If no response after 7 days:</span> No pressure if timing is not right. If priorities shift, I am happy to reconnect.</p>
            </div>

            <div className="mt-5 pt-4 border-t border-border">
              <h3 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Executive Coach Outreach - Quick Use</h3>
              <p className="text-[13px] text-muted-foreground mb-3">
                Steps and message options are now on this page and fully documented in the guide above.
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-[13px] text-muted-foreground leading-relaxed">
                <li>Build 10-15 daily prospects in Sales Navigator (1-10 employee firms, active in last 30 days).</li>
                <li>Tag each coach persona (Transition, VP-to-CXO, Search Affiliate, Board).</li>
                <li>Send personalized connection notes the same day.</li>
                <li>Run the 7-touch sequence: day 0, 1, 3, 7, 14, 21, 30.</li>
                <li>Log objections and outcomes after every touch.</li>
              </ol>
            </div>

            <div id="council-review" className="mt-5 pt-4 border-t border-border">
              <h3 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Synthetic Council Review - Sales Marketing And Pricing</h3>
              <Card className="p-0 overflow-x-auto">
                <Table className="text-[13px] text-left">
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead className="px-3 py-2 font-semibold text-foreground">Member</TableHead>
                      <TableHead className="px-3 py-2 font-semibold text-foreground">Feedback</TableHead>
                      <TableHead className="px-3 py-2 font-semibold text-foreground">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="px-3 py-2 text-foreground font-semibold">Dave Gerhardt</TableCell>
                      <TableCell className="px-3 py-2 text-muted-foreground whitespace-normal">Strong opener and good founder-style directness. Version A is punchier and more likely to get a reply.</TableCell>
                      <TableCell className="px-3 py-2 text-foreground font-semibold">A-</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="px-3 py-2 text-foreground font-semibold">April Dunford</TableCell>
                      <TableCell className="px-3 py-2 text-muted-foreground whitespace-normal">Clear who this is for: CIO-level transitions. Positioning is cleaner when centered on the execution gap between sessions.</TableCell>
                      <TableCell className="px-3 py-2 text-foreground font-semibold">A</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="px-3 py-2 text-foreground font-semibold">John McMahon</TableCell>
                      <TableCell className="px-3 py-2 text-muted-foreground whitespace-normal">Pain and urgency are visible. Keep CTA specific at 15 minutes and avoid adding extra links in first follow-up.</TableCell>
                      <TableCell className="px-3 py-2 text-foreground font-semibold">A-</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="px-3 py-2 text-foreground font-semibold">Katelyn Bourgoin</TableCell>
                      <TableCell className="px-3 py-2 text-muted-foreground whitespace-normal">Version B lands emotional reality better. "Quiet middle" language is memorable and human.</TableCell>
                      <TableCell className="px-3 py-2 text-foreground font-semibold">A</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="px-3 py-2 text-foreground font-semibold">Patrick Campbell</TableCell>
                      <TableCell className="px-3 py-2 text-muted-foreground whitespace-normal">Value framing is stronger when outcomes are explicit: sharper conversations and faster search velocity. Good premium signal without pricing friction.</TableCell>
                      <TableCell className="px-3 py-2 text-foreground font-semibold">A-</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Card>
            </div>
          </div>

          {/* Pillar legend */}
          <div id="pillar-legend" className="mt-6 pt-5 border-t border-border">
            <h3 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">What the pillar labels mean</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { label: 'Search Craft', desc: 'Practical advice for running a senior executive job search' },
                { label: 'Market Intelligence', desc: 'Data and signals about the executive hiring market' },
                { label: 'Behind the Build', desc: 'The process of building Starting Monday' },
                { label: 'User Story', desc: 'Real experiences from executives in search' },
                { label: 'Engagement', desc: 'Questions and conversation-starters for the audience' },
              ].map(p => (
                <div key={p.label} className="flex gap-2 items-start">
                  <Badge className="shrink-0">{p.label}</Badge>
                  <span className="text-[13px] text-muted-foreground mt-0.5">{p.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-[13px] text-muted-foreground">
              This page: <span className="font-mono text-muted-foreground">https://startingmonday.app/dashboard/admin/social</span>
            </p>
          </div>
        </Card>
        </section>

      </main>
    </div>
  )
}

