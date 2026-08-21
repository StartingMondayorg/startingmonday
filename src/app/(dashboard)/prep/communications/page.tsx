import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Alert, AlertDescription, AlertTitle, Button, Card, Input, Label, Textarea } from '@/components/ui'
export const metadata = {
  title: 'Communications Prep - Starting Monday',
  description: 'Craft your outreach messages, talking points, and follow-up sequences.',
}

export default async function CommunicationsPrepPage() {
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
          Communications Prep
        </h1>
        <p className="text-[16px] leading-relaxed text-muted-foreground max-w-2xl">
          Craft messages, templates, and talking points for your outreach.
        </p>
      </div>

      {/* Research insight card */}
      <Card className="border-primary/30 bg-primary/5 p-6 sm:p-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-primary mb-3">
          From coaching research
        </p>
        <p className="text-[15px] leading-relaxed text-foreground">
          "The leaders who got the most responses told us they had 2-3 strong opening messages. They didn't change the message every day. They sent the same message to 10 people, learned what worked, then refined it. Consistency beats perfection."
        </p>
      </Card>

      {/* Form sections */}
      <form className="space-y-8">
        {/* Opening message */}
        <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
            Opening Message Template
          </p>

          <div>
            <Label htmlFor="opening-message" className="block text-[13px] font-semibold text-foreground mb-2">
              Your standard opening (LinkedIn/Email)
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              Keep it to 3-4 sentences. What makes them want to respond?
            </p>
            <Textarea
              id="opening-message"
              placeholder="Hi [Name], I've been following [Company] for the [reason]. I'm currently exploring [roles/opportunities] in [market]. Would you be open to a quick conversation about [context]?&#10;&#10;- [Your name]"
              rows={6}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground font-mono text-[12px] focus-visible:border-primary/50"
            />
          </div>

          <div>
            <Label htmlFor="opening-variants" className="block text-[13px] font-semibold text-foreground mb-2">
              2-3 variations of your opening
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              Different angles for different types of contacts. Test each one.
            </p>
            <Textarea
              id="opening-variants"
              placeholder="Variation 1: [Different angle/context]&#10;&#10;Variation 2: [Alternative approach]&#10;&#10;Variation 3: [Third perspective]"
              rows={6}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground font-mono text-[12px] focus-visible:border-primary/50"
            />
          </div>
        </Card>

        {/* Value proposition */}
        <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
            Your Value Proposition
          </p>

          <div>
            <Label htmlFor="value-prop" className="block text-[13px] font-semibold text-foreground mb-2">
              In one sentence: what value do you bring?
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              Be specific. What problem do you solve? What experience matters?
            </p>
            <Input
              id="value-prop"
              type="text"
              placeholder="E.g., I build engineering teams that scale from startup chaos to systematic execution."
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>

          <div>
            <Label htmlFor="proof-points" className="block text-[13px] font-semibold text-foreground mb-2">
              Your top 3 proof points
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              Specific wins or experiences that support your value prop.
            </p>
            <Textarea
              id="proof-points"
              placeholder="1. [Specific win or accomplishment]&#10;2. [Another relevant success]&#10;3. [Third proof point]"
              rows={4}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground font-mono text-[12px] focus-visible:border-primary/50"
            />
          </div>
        </Card>

        {/* Follow-up sequences */}
        <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
            Follow-Up Sequence
          </p>

          <div>
            <Label htmlFor="followup-1" className="block text-[13px] font-semibold text-foreground mb-2">
              Follow-up 1 (3-5 days later)
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              Light touch. Add new context or just a reminder.
            </p>
            <Textarea
              id="followup-1"
              placeholder="Hi [Name], wanted to circle back on my previous message. I see [Company] just [recent news]. Would be great to chat about [angle]. Let me know your availability?"
              rows={3}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground font-mono text-[12px] focus-visible:border-primary/50"
            />
          </div>

          <div>
            <Label htmlFor="followup-2" className="block text-[13px] font-semibold text-foreground mb-2">
              Follow-up 2 (7-10 days later)
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              Change channel or add a different angle.
            </p>
            <Textarea
              id="followup-2"
              placeholder="Hi [Name], I'm going to assume you're busy (or missed my previous message). I'm specifically interested in [specific context]. If you're open to a quick 15-min call, let me know."
              rows={3}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground font-mono text-[12px] focus-visible:border-primary/50"
            />
          </div>
        </Card>

        {/* Conversation starters */}
        <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
            Conversation Starters
          </p>

          <div>
            <Label htmlFor="intro-questions" className="block text-[13px] font-semibold text-foreground mb-2">
              Questions you'll ask in an intro call
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              Start here. Learn about them first.
            </p>
            <Textarea
              id="intro-questions"
              placeholder="1. How did you end up at [Company]?&#10;2. What are your biggest priorities right now?&#10;3. What's the org structure like on your team?"
              rows={4}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground font-mono text-[12px] focus-visible:border-primary/50"
            />
          </div>

          <div>
            <Label htmlFor="listening-moments" className="block text-[13px] font-semibold text-foreground mb-2">
              When/how you'll transition to your background
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              Listen first. Then share when there's a natural connection.
            </p>
            <Textarea
              id="listening-moments"
              placeholder="When they mention [challenge], that's when I'll share [my relevant experience]. I'll keep it to one quick story, then ask a follow-up question."
              rows={3}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>
        </Card>

        {/* Objection handling */}
        <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
            Common Objections &amp; Your Response
          </p>

          <div>
            <Label htmlFor="objections" className="block text-[13px] font-semibold text-foreground mb-2">
              "I'm not sure if we're hiring right now"
            </Label>
            <Textarea
              id="objections"
              placeholder="Your response..."
              rows={2}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>

          <div>
            <Label htmlFor="objections-2" className="block text-[13px] font-semibold text-foreground mb-2">
              "Send me your resume and I'll pass it along"
            </Label>
            <Textarea
              id="objections-2"
              placeholder="Your response..."
              rows={2}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>

          <div>
            <Label htmlFor="objections-3" className="block text-[13px] font-semibold text-foreground mb-2">
              "I'm pretty happy where I am"
            </Label>
            <Textarea
              id="objections-3"
              placeholder="Your response..."
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
          You've now completed Interview, Companies, Meetings, and Communications prep. You're ready to execute:
        </AlertDescription>
        <ul className="space-y-2 text-[13px] text-muted-foreground mb-6">
          <li>• <strong>Week 1-2:</strong> Research your target companies and signals</li>
          <li>• <strong>Week 3-4:</strong> Begin warm introductions through your network</li>
          <li>• <strong>Week 5+:</strong> Move into active conversations and interviews</li>
        </ul>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" render={<Link href="/dashboard" />}>
            Back to dashboard
          </Button>
          <Button variant="link" render={<Link href="/prep/interview" />}>
            Review your prep
          </Button>
        </div>
      </Alert>
    </div>
  )
}
