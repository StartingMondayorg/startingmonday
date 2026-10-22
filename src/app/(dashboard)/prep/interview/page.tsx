import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CultureFitRetentionSignalsCard } from '@/app/(dashboard)/prep/_components/CultureFitRetentionSignalsCard'
import { MeetingDebriefPersistencePanel } from '@/app/(dashboard)/prep/_components/MeetingDebriefPersistencePanel'
import { Alert, AlertDescription, Button, Card, Input, Label, Textarea } from '@/components/ui'
import { saveInterviewPrep } from './actions'
import { toDateTimeLocalValue, type InterviewPrepAnswers, type InterviewPrepRow } from './interview-prep-form'
import { InterviewPrepList } from './interview-prep-list'

export const metadata = {
  title: 'Interview Prep - Starting Monday',
  description: 'Prepare for your next interview with research-backed frameworks and position-specific talking points.',
}

export default async function InterviewPrepPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; saved?: string; error?: string; new?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { id: requestedId, saved, error, new: startNew } = await searchParams

  const { data: prepRows } = await supabase
    .from('interview_preps')
    .select('id, company_name, role_title, interview_at, answers, status, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(20)
  const preps = (prepRows ?? []) as InterviewPrepRow[]
  // The most recent prep opens by default so the user picks up where they left off; ?new=1 starts a blank one.
  const current = startNew ? null : (requestedId ? preps.find(p => p.id === requestedId) ?? null : preps[0] ?? null)
  const answers = (current?.answers ?? {}) as InterviewPrepAnswers

  const banner =
    saved === 'saved' ? { variant: 'success' as const, text: 'Interview prep saved.' } :
    saved === 'draft' ? { variant: 'success' as const, text: 'Draft saved. Come back any time to finish it.' } :
    error === 'empty' ? { variant: 'destructive' as const, text: 'Nothing to save yet. Fill in at least one field.' } :
    error === 'save' ? { variant: 'destructive' as const, text: 'We could not save your prep. Please try again.' } :
    null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-[32px] font-bold tracking-tight text-foreground sm:text-[40px]">
          Interview Prep
        </h1>
        <p className="text-[16px] leading-relaxed text-muted-foreground max-w-2xl">
          Build your interview narrative before the call. Research, positioning, and objection prep.
        </p>
      </div>

      {/* Research insight card */}
      <Card className="border-primary/30 bg-primary/5 p-6 sm:p-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-primary mb-3">
          From coaching research
        </p>
        <p className="text-[15px] leading-relaxed text-foreground">
          "The leaders who got offers told us: they spent 3-4 hours before each call on research, positioning, and role-fit framing. They didn't rely on the interview to tell the story. They arrived with the story already clear."
        </p>
      </Card>

      {banner && (
        <Alert variant={banner.variant} data-testid="interview-prep-banner"><AlertDescription>{banner.text}</AlertDescription></Alert>
      )}

      <InterviewPrepList preps={preps} currentId={current?.id ?? null} />

      {/* Form sections */}
      <form id="interview-prep-form" key={current?.id ?? 'new'} action={saveInterviewPrep} className="space-y-8">
        {current && <input type="hidden" name="id" value={current.id} />}
        {/* Role & Company */}
        <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
            The Role
          </p>

          <div>
            <Label htmlFor="company-name" className="block text-[13px] font-semibold text-foreground mb-2">
              Company name
            </Label>
            <Input
              id="company-name"
              name="company_name"
              defaultValue={current?.company_name ?? ''}
              type="text"
              placeholder="e.g., Figma, Stripe, Notion"
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>

          <div>
            <Label htmlFor="role-title" className="block text-[13px] font-semibold text-foreground mb-2">
              Role title
            </Label>
            <Input
              id="role-title"
              name="role_title"
              defaultValue={current?.role_title ?? ''}
              type="text"
              placeholder="e.g., VP Engineering, Director of Product"
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>

          <div>
            <Label htmlFor="interview-date" className="block text-[13px] font-semibold text-foreground mb-2">
              Interview date & time
            </Label>
            <Input
              id="interview-date"
              name="interview_at"
              defaultValue={toDateTimeLocalValue(current?.interview_at ?? null)}
              type="datetime-local"
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>
        </Card>

        {/* Positioning */}
        <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
            Your Positioning
          </p>

          <div>
            <Label htmlFor="positioning" className="block text-[13px] font-semibold text-foreground mb-2">
              Opening statement (2-3 sentences)
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              How you describe what you do and why you're right for this role.
            </p>
            <Textarea
              id="positioning"
              name="positioning"
              defaultValue={answers.positioning ?? ''}
              placeholder="Describe your background and why this role matters to you..."
              rows={4}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>

          <div>
            <Label htmlFor="why-now" className="block text-[13px] font-semibold text-foreground mb-2">
              Why you're moving now
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              Your clear, compelling reason for this search.
            </p>
            <Textarea
              id="why-now"
              name="why_now"
              defaultValue={answers.why_now ?? ''}
              placeholder="Be specific about timing, growth opportunities, or misalignment..."
              rows={3}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>
        </Card>

        {/* Company research */}
        <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
            Company Research
          </p>

          <div>
            <Label htmlFor="company-context" className="block text-[13px] font-semibold text-foreground mb-2">
              What's happening at this company right now?
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              Recent funding, product launches, reorganization, market moves.
            </p>
            <Textarea
              id="company-context"
              name="company_context"
              defaultValue={answers.company_context ?? ''}
              placeholder="Recent news, strategy shifts, product announcements..."
              rows={4}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>

          <div>
            <Label htmlFor="role-fit" className="block text-[13px] font-semibold text-foreground mb-2">
              Why this role matters to their strategy
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              Connect the role to company moves. What problem are they solving?
            </p>
            <Textarea
              id="role-fit"
              name="role_fit"
              defaultValue={answers.role_fit ?? ''}
              placeholder="How does this role support their current priorities?"
              rows={3}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>
        </Card>

        {/* Objections */}
        <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
            Anticipated Objections
          </p>

          <div>
            <Label htmlFor="objection" className="block text-[13px] font-semibold text-foreground mb-2">
              What concerns might they have?
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              Gaps in background, technical skills, industry experience?
            </p>
            <Textarea
              id="objection"
              name="objection"
              defaultValue={answers.objection ?? ''}
              placeholder="Gaps you anticipate they might raise..."
              rows={3}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>

          <div>
            <Label htmlFor="objection-response" className="block text-[13px] font-semibold text-foreground mb-2">
              How you'll address it
            </Label>
            <p className="text-[12px] text-muted-foreground mb-3">
              Your proof point or reframe.
            </p>
            <Textarea
              id="objection-response"
              name="objection_response"
              defaultValue={answers.objection_response ?? ''}
              placeholder="Your response framing and proof..."
              rows={3}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between pt-4">
          <Button
            type="submit"
            name="status"
            value="draft"
            variant="outline"
            className="border-border text-muted-foreground hover:text-foreground"
          >
            Save as draft
          </Button>
          <Button type="submit" name="status" value="saved">
            Save interview prep
          </Button>
        </div>
      </form>

      {/* Folded in from /prep/meetings (R-3 phase 2b): the debrief panel is the one piece of prep that saves. */}
      <Card className="border-border bg-card/40 p-6 sm:p-8 space-y-6">
        <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
          Meeting debrief (any meeting)
        </p>
        <MeetingDebriefPersistencePanel />
      </Card>

      <CultureFitRetentionSignalsCard />

      {/* Next steps */}
      <Card className="border-border bg-card/40 p-6 sm:p-8">
        <p className="text-[13px] font-semibold text-muted-foreground mb-3">Next: Review your prep</p>
        <p className="text-[14px] leading-relaxed text-foreground mb-4">
          Come back here 24 hours before your interview. Practice your opening, your company narrative, and your objection responses. You're aiming for natural conversation, not recitation.
        </p>
        <Button variant="link" className="px-0" render={<Link href="/dashboard" />}>
          Back to the dashboard →
        </Button>
      </Card>
    </div>
  )
}
