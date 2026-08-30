import Link from 'next/link'
import { Button, Card, Label, Textarea } from '@/components/ui'
export const metadata = {
  title: 'Meetings Strategy - Starting Monday',
  description: 'Plan your conversation strategy and relationship progression.',
}

export default function DemoMeetingsPrepPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      {/* Task navigation */}
      <nav className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            <Link
              href="/demo/prep-interview"
              className="flex-shrink-0 px-4 py-3 text-[13px] font-medium border-b-2 border-transparent text-muted-foreground transition-colors whitespace-nowrap"
            >
              Interview
            </Link>
            <Link
              href="/demo/prep-companies"
              className="flex-shrink-0 px-4 py-3 text-[13px] font-medium border-b-2 border-transparent text-muted-foreground transition-colors whitespace-nowrap"
            >
              Companies
            </Link>
            <Link
              href="/demo/prep-meetings"
              className="flex-shrink-0 px-4 py-3 text-[13px] font-medium border-b-2 border-primary/30 text-primary transition-colors whitespace-nowrap"
            >
              Meetings
            </Link>
            <Link
              href="/demo/prep-communications"
              className="flex-shrink-0 px-4 py-3 text-[13px] font-medium border-b-2 border-transparent text-muted-foreground transition-colors whitespace-nowrap"
            >
              Communications
            </Link>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-[32px] font-bold tracking-tight text-foreground sm:text-[40px]">
              Meetings Strategy
            </h1>
            <p className="text-[13px] font-semibold text-muted-foreground">
              12-18 minutes
            </p>
          </div>
          <p className="text-[16px] leading-relaxed text-muted-foreground max-w-2xl">
            Plan your conversation sequence from introduction through offer decision.
          </p>
        </div>

        {/* Research insight card */}
        <Card className="border-primary/30 bg-primary/5 p-6 sm:p-8">
          <p className="text-[15px] leading-relaxed text-foreground mb-4">
            "The leaders who managed their search best mapped out a conversation sequence: intro → deeper context → specific role → decision. They didn't walk into calls without a plan. They knew what information they needed at each stage."
          </p>
          <div className="pt-4 border-t border-primary/20">
            <p className="text-[13px] font-semibold text-primary mb-2">How this helps:</p>
            <p className="text-[13px] text-primary/80">A structured plan prevents you from meandering conversations or asking the wrong questions at the wrong time. Each phase builds toward a decision, so you move faster and close stronger.</p>
          </div>
        </Card>

        {/* Form sections */}
        <form className="space-y-8">
          {/* Phase 1 */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
            <p className="text-[13px] font-semibold text-primary/70">Section 1 of 4</p>
          </div>
          <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
            <p className="text-[13px] font-semibold text-muted-foreground mb-4">
              Phase 1: Introduction Meetings
            </p>

            <div>
              <Label htmlFor="intro-goal" className="block text-[13px] font-semibold text-foreground mb-2">
                Your goal in an intro call
              </Label>
              <Textarea
                id="intro-goal"
                defaultValue="Build connection and trust. Understand their world: what they care about, current priorities, team structure. Find common ground. Set up a potential second meeting if there's natural fit."
                rows={3}
                className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
              />
            </div>

            <div>
              <Label htmlFor="intro-flow" className="block text-[13px] font-semibold text-foreground mb-2">
                Your intro call flow
              </Label>
              <Textarea
                id="intro-flow"
                defaultValue="1. 'How did you end up at [Company]?' (Learn their story)
2. 'What's exciting/challenging about your role right now?' (Priorities)
3. [Share 1 relevant story from my background that shows I understand their world]
4. 'What would success look like in your role in the next year?'
5. Close: 'I'd like to keep the conversation going. Would you be open to connecting in a few weeks?' (Leave door open)"
                rows={4}
                className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
              />
            </div>
          </Card>

          {/* Phase 2 */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
            <p className="text-[13px] font-semibold text-primary/70">Section 2 of 4</p>
          </div>
          <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
            <p className="text-[13px] font-semibold text-muted-foreground mb-4">
              Phase 2: Role-Fit Meetings
            </p>

            <div>
              <Label htmlFor="rolefit-goal" className="block text-[13px] font-semibold text-foreground mb-2">
                Your goal in a role-fit call
              </Label>
              <Textarea
                id="rolefit-goal"
                defaultValue="Explore if a specific role exists or is emerging. Understand the team structure, mandate, and timeline. Determine if there's mutual interest in moving forward."
                rows={2}
                className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
              />
            </div>

            <div>
              <Label htmlFor="rolefit-questions" className="block text-[13px] font-semibold text-foreground mb-2">
                Your key questions
              </Label>
              <Textarea
                id="rolefit-questions"
                defaultValue="- What's the org structure under you? Who owns what?
- What's the mandate for this role in the next 2-3 years?
- What's the current biggest challenge in your team?
- Is this a newly created role or is someone in it now?
- Timeline: When would you need to fill this?"
                rows={4}
                className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
              />
            </div>
          </Card>

          {/* Phase 3 */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
            <p className="text-[13px] font-semibold text-primary/70">Section 3 of 4</p>
          </div>
          <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
            <p className="text-[13px] font-semibold text-muted-foreground mb-4">
              Phase 3: Formal Interviews
            </p>

            <div>
              <Label htmlFor="interview-prep" className="block text-[13px] font-semibold text-foreground mb-2">
                Interview preparation approach
              </Label>
              <Textarea
                id="interview-prep"
                defaultValue="3-4 hours minimum prep per interview. Review their latest funding, product announcements, leadership team changes. Prepare 2-3 questions that show I understand their business. Practice my opening positioning. Mock objection handling."
                rows={3}
                className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
              />
            </div>
          </Card>

          {/* Phase 4 */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
            <p className="text-[13px] font-semibold text-primary/70">Section 4 of 4</p>
          </div>
          <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
            <p className="text-[13px] font-semibold text-muted-foreground mb-4">
              Phase 4: Offer & Decision
            </p>

            <div>
              <Label htmlFor="eval-criteria" className="block text-[13px] font-semibold text-foreground mb-2">
                How you'll evaluate an offer
              </Label>
              <Textarea
                id="eval-criteria"
                defaultValue="Role scope: Can I influence product direction? Team size: Reporting structure and hiring freedom. Growth: Market potential and company trajectory. Impact: Are we solving real problems? Culture: Do I believe in their mission? Comp: Salary + equity + benefits competitive with market."
                rows={3}
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
              Save meetings strategy
            </Button>
          </div>
        </form>

        {/* Next steps */}
        <Card className="border-border bg-card/40 p-6 sm:p-8">
          <p className="text-[13px] font-semibold text-muted-foreground mb-3">Next: Communications prep</p>
          <p className="text-[14px] leading-relaxed text-foreground mb-4">
            With your meetings strategy mapped, you're ready to craft your outreach messages.
          </p>
          <Link
            href="/demo/prep-communications"
            className="inline-flex px-4 py-2 text-[13px] font-semibold text-primary transition-colors"
          >
            Move to communications prep →
          </Link>
        </Card>
      </div>
    </div>
  )
}
