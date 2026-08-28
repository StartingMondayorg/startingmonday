import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CultureFitRetentionSignalsCard } from '@/app/(dashboard)/prep/_components/CultureFitRetentionSignalsCard'
import { MeetingDebriefPersistencePanel } from '@/app/(dashboard)/prep/_components/MeetingDebriefPersistencePanel'
import { Button, Card, Label, Textarea } from '@/components/ui'
export const metadata = {
  title: 'Meetings Strategy - Starting Monday',
  description: 'Plan your conversation strategy and relationship progression.',
}

export default async function MeetingsPrepPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-[32px] font-bold tracking-tight text-foreground sm:text-[40px]">
          Meetings Strategy
        </h1>
        <p className="text-[16px] leading-relaxed text-muted-foreground max-w-2xl">
          Plan your conversation sequence from introduction through offer decision.
        </p>
      </div>

      {/* Research insight card */}
      <Card className="border-primary/30 bg-primary/5 p-6 sm:p-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-primary mb-3">
          From coaching research
        </p>
        <p className="text-[15px] leading-relaxed text-foreground">
          "The leaders who managed their search best didn't just react to meetings. They mapped out a conversation sequence: intro meeting to explore, deeper context meeting, specific role conversation, then decision conversation. They knew what they were solving for in each meeting before it happened."
        </p>
      </Card>

      {/* Form sections */}
      <form className="space-y-8">
        {/* Introduction meetings */}
        <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
            Phase 1: Introduction Meetings
          </p>

          <div>
            <Label htmlFor="intro-goal" className="block text-[13px] font-semibold text-foreground mb-2">
              Your goal in an intro call
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              E.g., understand their business, learn about their team, find a specific point of connection.
            </p>
            <Textarea
              id="intro-goal"
              placeholder="What are you trying to learn or establish in a first conversation?"
              rows={3}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>

          <div>
            <Label htmlFor="intro-flow" className="block text-[13px] font-semibold text-foreground mb-2">
              Your intro call flow
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              How you'll move through the conversation (e.g., context → their role → your background → shared interests).
            </p>
            <Textarea
              id="intro-flow"
              placeholder="Your conversation structure and talking points..."
              rows={4}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>

          <div>
            <Label htmlFor="intro-close" className="block text-[13px] font-semibold text-foreground mb-2">
              How you'll close an intro call
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              What does success look like? A second meeting? An email intro?
            </p>
            <Textarea
              id="intro-close"
              placeholder="Your closing approach: what's the next step?"
              rows={2}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>
        </Card>

        {/* Deeper context meetings */}
        <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
            Phase 2: Role-Fit Meetings
          </p>

          <div>
            <Label htmlFor="rolefit-goal" className="block text-[13px] font-semibold text-foreground mb-2">
              Your goal in a role-fit call
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              Explore if a specific role exists, understand the team and mandate.
            </p>
            <Textarea
              id="rolefit-goal"
              placeholder="What are you trying to determine about a specific role?"
              rows={3}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>

          <div>
            <Label htmlFor="rolefit-questions" className="block text-[13px] font-semibold text-foreground mb-2">
              Your key questions
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              What you need to know to determine fit (team, mandate, timeline).
            </p>
            <Textarea
              id="rolefit-questions"
              placeholder="Role scope, team structure, reporting relationship, priorities, timeline..."
              rows={4}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>

          <div>
            <Label htmlFor="rolefit-sell" className="block text-[13px] font-semibold text-foreground mb-2">
              How you'll position yourself
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              Why you're the right fit for this role specifically.
            </p>
            <Textarea
              id="rolefit-sell"
              placeholder="Your relevant background, relevant wins, why you understand their challenge..."
              rows={3}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>
        </Card>

        {/* Interview meetings */}
        <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
            Phase 3: Formal Interviews
          </p>

          <div>
            <Label htmlFor="interview-prep" className="block text-[13px] font-semibold text-foreground mb-2">
              Interview preparation approach
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              How you prepare (research, practice, conversation strategy).
            </p>
            <Textarea
              id="interview-prep"
              placeholder="Your prep routine before formal interviews..."
              rows={3}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>

          <div>
            <Label htmlFor="decision-timeline" className="block text-[13px] font-semibold text-foreground mb-2">
              Timeline expectations
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              How many interviews? What's your expected timeline?
            </p>
            <Textarea
              id="decision-timeline"
              placeholder="Expected interview stages, timeline, decision points..."
              rows={2}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>
        </Card>

        {/* Offer & negotiation */}
        <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
            Phase 4: Offer & Decision
          </p>

          <CultureFitRetentionSignalsCard />

          <div>
            <Label htmlFor="eval-criteria" className="block text-[13px] font-semibold text-foreground mb-2">
              How you'll evaluate an offer
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              Compensation, role scope, team, growth opportunity, culture fit?
            </p>
            <Textarea
              id="eval-criteria"
              placeholder="Your key evaluation criteria for accepting an offer..."
              rows={3}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>

          <div>
            <Label htmlFor="negotiation-strategy" className="block text-[13px] font-semibold text-foreground mb-2">
              Negotiation approach
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              What you'll negotiate on, your walkaway points?
            </p>
            <Textarea
              id="negotiation-strategy"
              placeholder="What matters most to you: salary, title, scope, start date, flex options?"
              rows={2}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>
        </Card>

        <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
            Meeting Debrief (Any Meeting)
          </p>

          <MeetingDebriefPersistencePanel />
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
          With your meetings strategy mapped, you're ready to craft your outreach messages. How will you introduce yourself and move a conversation forward?
        </p>
        <Button variant="link" className="px-0" render={<Link href="/prep/communications" />}>
          Move to communications prep →
        </Button>
      </Card>
    </div>
  )
}
