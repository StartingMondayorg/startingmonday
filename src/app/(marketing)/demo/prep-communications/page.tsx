import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle, Button, Card, Input, Label, Textarea } from '@/components/ui'
export const metadata = {
  title: 'Communications Prep - Starting Monday',
  description: 'Craft your outreach messages, talking points, and follow-up sequences.',
}

export default function DemoCommunicationsPrepPage() {
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
              className="flex-shrink-0 px-4 py-3 text-[13px] font-medium border-b-2 border-transparent text-muted-foreground transition-colors whitespace-nowrap"
            >
              Meetings
            </Link>
            <Link
              href="/demo/prep-communications"
              className="flex-shrink-0 px-4 py-3 text-[13px] font-medium border-b-2 border-primary/30 text-primary transition-colors whitespace-nowrap"
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
              Communications Prep
            </h1>
            <p className="text-[13px] font-semibold text-muted-foreground">
              18-25 minutes
            </p>
          </div>
          <p className="text-[16px] leading-relaxed text-muted-foreground max-w-2xl">
            Craft messages, templates, and talking points for your outreach.
          </p>
        </div>

        {/* Research insight card */}
        <Card className="border-primary/30 bg-primary/5 p-6 sm:p-8">
          <p className="text-[15px] leading-relaxed text-foreground mb-4">
            "The leaders who got the most responses had 2-3 strong opening messages. They didn't change it daily. They sent the same message to 10 people, learned what worked, then refined it. Consistency beats perfection."
          </p>
          <div className="pt-4 border-t border-primary/20">
            <p className="text-[13px] font-semibold text-primary mb-2">How this helps:</p>
            <p className="text-[13px] text-primary/80">Repetition works. Your first draft won't be perfect, but it doesn't need to be. You'll get feedback through response rates, then iterate. Sending the same message 10 times is more effective than perfecting one.</p>
          </div>
        </Card>

        {/* Form sections */}
        <form className="space-y-8">
          {/* Opening message */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
            <p className="text-[13px] font-semibold text-primary/70">Section 1 of 6</p>
          </div>
          <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
            <p className="text-[13px] font-semibold text-muted-foreground mb-4">
              Opening Message Template
            </p>

            <div>
              <Label htmlFor="opening-message" className="block text-[13px] font-semibold text-foreground mb-2">
                Your standard opening (LinkedIn/Email)
              </Label>
              <Textarea
                id="opening-message"
                defaultValue="Hi [Name], I've been following Figma's product direction - the enterprise push is impressive and I think I can help. I'm currently exploring VP engineering opportunities at hyper-growth companies (specifically design tools and infrastructure). Would you be open to a quick conversation about how your team scales infrastructure?

- Michael"
                rows={6}
                className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
              />
            </div>

            <div>
              <Label htmlFor="opening-variants" className="block text-[13px] font-semibold text-foreground mb-2">
                2-3 variations of your opening
              </Label>
              <Textarea
                id="opening-variants"
                defaultValue="Variation 1 (Founder/CEO): Hi [Name], I saw your [recent announcement]. Your approach to [challenge] reminds me of a problem we solved at [my company]. Open to comparing notes?

Variation 2 (VPE/Director): I've been impressed by how your team ships so fast. I'm exploring my next role and wondering if you have 20 mins to chat about how you scaled your eng team.

Variation 3 (Warm intro): Hey [Name], [Mutual friend] thought we should connect. I'm in transition exploring VP eng roles in [space], and your work at [company] is exactly the kind of challenge I'm excited about."
                rows={6}
                className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
              />
            </div>
          </Card>

          {/* Value proposition */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
            <p className="text-[13px] font-semibold text-primary/70">Section 2 of 6</p>
          </div>
          <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
            <p className="text-[13px] font-semibold text-muted-foreground mb-4">
              Your Value Proposition
            </p>

            <div>
              <Label htmlFor="value-prop" className="block text-[13px] font-semibold text-foreground mb-2">
                In one sentence: what value do you bring?
              </Label>
              <Input
                id="value-prop"
                type="text"
                defaultValue="I scale distributed systems and engineering teams from chaos to operational excellence."
                className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
              />
            </div>

            <div>
              <Label htmlFor="proof-points" className="block text-[13px] font-semibold text-foreground mb-2">
                Your top 3 proof points
              </Label>
              <Textarea
                id="proof-points"
                defaultValue="1. Built infrastructure at Stripe that scaled from 10K to 1M+ TPS with 99.99% uptime.
2. Led team from 20 to 150 engineers while maintaining shipping velocity.
3. Designed and launched 3 major platform initiatives (payments API, webhooks, sidecars) that became core products."
                rows={4}
                className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
              />
            </div>
          </Card>

          {/* Follow-up sequences */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
            <p className="text-[13px] font-semibold text-primary/70">Section 3 of 6</p>
          </div>
          <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
            <p className="text-[13px] font-semibold text-muted-foreground mb-4">
              Follow-Up Sequence
            </p>

            <div>
              <Label htmlFor="followup-1" className="block text-[13px] font-semibold text-foreground mb-2">
                Follow-up 1 (3-5 days later)
              </Label>
              <Textarea
                id="followup-1"
                defaultValue="Hi [Name], I know you're probably swamped. Saw your new enterprise tier announcement - that's a big move. If you have 20 mins, would love to chat about the infrastructure needs that implies. If now's not good, I totally understand!"
                rows={3}
                className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
              />
            </div>

            <div>
              <Label htmlFor="followup-2" className="block text-[13px] font-semibold text-foreground mb-2">
                Follow-up 2 (7-10 days later)
              </Label>
              <Textarea
                id="followup-2"
                defaultValue="One more attempt: [Mutual connection] thought we should connect. I'm exploring VP eng roles in design tools specifically. No pressure, but if you're open to a quick call, I think we'd have a good conversation."
                rows={3}
                className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
              />
            </div>
          </Card>

          {/* Conversation starters */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
            <p className="text-[13px] font-semibold text-primary/70">Section 4 of 6</p>
          </div>
          <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
            <p className="text-[13px] font-semibold text-muted-foreground mb-4">
              Conversation Starters
            </p>

            <div>
              <Label htmlFor="intro-questions" className="block text-[13px] font-semibold text-foreground mb-2">
                Questions you'll ask in an intro call
              </Label>
              <Textarea
                id="intro-questions"
                defaultValue="1. How did you get to Figma and what drew you to the role?
2. What's your biggest infrastructure challenge right now?
3. What's the team structure like and how do you approach technical hiring?
4. What's exciting about Figma's direction in the next 12 months?"
                rows={4}
                className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
              />
            </div>
          </Card>

          {/* Common objections */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
            <p className="text-[13px] font-semibold text-primary/70">Section 5 of 6</p>
          </div>
          <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
            <p className="text-[13px] font-semibold text-muted-foreground mb-4">
              Common Objections &amp; Your Response
            </p>

            <div>
              <Label htmlFor="objections" className="block text-[13px] font-semibold text-foreground mb-2">
                "I'm not sure if we're hiring right now"
              </Label>
              <Textarea
                id="objections"
                defaultValue="'I totally get it - no ask for a job. I'm just curious about how you're thinking about growth and infrastructure. Even if Figma isn't the right fit, I'd love your advice on the market.'"
                rows={2}
                className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
              />
            </div>

            <div>
              <Label htmlFor="objections-2" className="block text-[13px] font-semibold text-foreground mb-2">
                "Send me your resume"
              </Label>
              <Textarea
                id="objections-2"
                defaultValue="'Happy to - but a quick conversation would probably be more valuable. Could we chat for 20 mins first? Then I'll have better context for what you're actually looking for.'"
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
              Save communications prep
            </Button>
          </div>
        </form>

        {/* Complete message */}
        <Alert variant="success" className="border-success/30 bg-success/5 p-6 sm:p-8">
          <AlertTitle>✓ Your prep is complete</AlertTitle>
          <AlertDescription className="text-foreground mb-4">
            You've now completed Interview, Companies, Meetings, and Communications prep. You're ready to execute.
          </AlertDescription>
          <ul className="space-y-2 text-[13px] text-muted-foreground mb-6">
            <li>• <strong>Week 1-2:</strong> Research your target companies and signals</li>
            <li>• <strong>Week 3-4:</strong> Begin warm introductions through your network</li>
            <li>• <strong>Week 5+:</strong> Move into active conversations and interviews</li>
          </ul>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/"
              className="px-4 py-2 text-[13px] font-semibold text-foreground bg-muted rounded-lg hover:bg-muted/90 transition-colors text-center"
            >
              Back to home
            </Link>
            <Link
              href="/demo/prep-interview"
              className="px-4 py-2 text-[13px] font-semibold text-primary transition-colors text-center"
            >
              Review your prep
            </Link>
          </div>
        </Alert>
      </div>
    </div>
  )
}
