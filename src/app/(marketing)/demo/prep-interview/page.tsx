import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Interview Prep - Starting Monday',
  description: 'Prepare for your next interview with research-backed frameworks and position-specific talking points.',
}

export default function DemoInterviewPrepPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      {/* Task navigation */}
      <nav className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            <Link
              href="/demo/prep-interview"
              className="flex-shrink-0 px-4 py-3 text-[13px] font-medium border-b-2 border-orange-400 text-orange-300 transition-colors whitespace-nowrap"
            >
              Interview
            </Link>
            <Link
              href="/demo/prep-companies"
              className="flex-shrink-0 px-4 py-3 text-[13px] font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-300 transition-colors whitespace-nowrap"
            >
              Companies
            </Link>
            <Link
              href="/demo/prep-meetings"
              className="flex-shrink-0 px-4 py-3 text-[13px] font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-300 transition-colors whitespace-nowrap"
            >
              Meetings
            </Link>
            <Link
              href="/demo/prep-communications"
              className="flex-shrink-0 px-4 py-3 text-[13px] font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-300 transition-colors whitespace-nowrap"
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
            <h1 className="text-[32px] font-bold tracking-tight text-white sm:text-[40px]">
              Interview Prep
            </h1>
            <p className="text-[13px] font-semibold text-slate-400">
              15-20 minutes
            </p>
          </div>
          <p className="text-[16px] leading-relaxed text-slate-300 max-w-2xl">
            Build your interview narrative before the call. Research, positioning, and objection prep.
          </p>
        </div>

        {/* Research insight card */}
        <Card className="border-orange-400/30 bg-orange-500/5 p-6 sm:p-8">
          <p className="text-[15px] leading-relaxed text-slate-100 mb-4">
            "The leaders who got offers told us: they spent 3-4 hours before each call on research, positioning, and role-fit framing. They didn't rely on the interview to tell the story. They arrived with the story already clear."
          </p>
          <div className="pt-4 border-t border-orange-400/20">
            <p className="text-[13px] font-semibold text-orange-300 mb-2">How this helps:</p>
            <p className="text-[13px] text-orange-300/80">This prep prevents you from improvising under pressure. You'll walk in confident, with your narrative locked, so you can listen and respond rather than think on your feet.</p>
          </div>
        </Card>

        {/* Form sections */}
        <form className="space-y-8">
          {/* Role & Company */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-400"></div>
            <p className="text-[13px] font-semibold text-orange-300/70">Section 1 of 4</p>
          </div>
          <Card className="border-white/10 bg-slate-900/40 p-6 sm:p-8 space-y-6">
            <p className="text-[13px] font-semibold text-slate-300 mb-4">
              The Role
            </p>

            <div>
              <Label htmlFor="company-name" className="block text-[13px] font-semibold text-slate-200 mb-2">
                Company name
              </Label>
              <Input
                id="company-name"
                type="text"
                placeholder="e.g., Figma, Stripe, Notion"
                defaultValue="Figma"
                className="bg-slate-950/50 border-slate-700/50 text-white placeholder-slate-500 focus-visible:border-orange-400/50"
              />
            </div>

            <div>
              <Label htmlFor="role-title" className="block text-[13px] font-semibold text-slate-200 mb-2">
                Role title
              </Label>
              <Input
                id="role-title"
                type="text"
                placeholder="e.g., VP Engineering, Director of Product"
                defaultValue="VP Engineering"
                className="bg-slate-950/50 border-slate-700/50 text-white placeholder-slate-500 focus-visible:border-orange-400/50"
              />
            </div>

            <div>
              <Label htmlFor="interview-date" className="block text-[13px] font-semibold text-slate-200 mb-2">
                Interview date & time
              </Label>
              <Input
                id="interview-date"
                type="datetime-local"
                defaultValue="2026-06-28T10:00"
                className="bg-slate-950/50 border-slate-700/50 text-white placeholder-slate-500 focus-visible:border-orange-400/50"
              />
            </div>
          </Card>

          {/* Positioning */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-400"></div>
            <p className="text-[13px] font-semibold text-orange-300/70">Section 2 of 4</p>
          </div>
          <Card className="border-white/10 bg-slate-900/40 p-6 sm:p-8 space-y-6">
            <p className="text-[13px] font-semibold text-slate-300 mb-4">
              Your Positioning
            </p>

            <div>
              <Label htmlFor="positioning" className="block text-[13px] font-semibold text-slate-200 mb-2">
                Opening statement (2-3 sentences)
              </Label>
              <p className="text-[12px] text-slate-400 mb-3">
                How you describe what you do and why you're right for this role.
              </p>
              <Textarea
                id="positioning"
                placeholder="Describe your background and why this role matters to you..."
                defaultValue="I build engineering teams that scale from startup chaos to systematic execution. Over the last 8 years, I've led teams from 5 to 150+ people, establishing technical direction and hiring discipline. At Stripe, I managed platform infrastructure and grew the team to build our foundational database systems."
                rows={4}
                className="bg-slate-950/50 border-slate-700/50 text-white placeholder-slate-500 focus-visible:border-orange-400/50"
              />
            </div>

            <div>
              <Label htmlFor="why-now" className="block text-[13px] font-semibold text-slate-200 mb-2">
                Why you're moving now
              </Label>
              <p className="text-[12px] text-slate-400 mb-3">
                Your clear, compelling reason for this search.
              </p>
              <Textarea
                id="why-now"
                placeholder="Be specific about timing, growth opportunities, or misalignment..."
                defaultValue="I'm looking for a next-stage role where I can shape product strategy alongside engineering. At my current role, engineering is fully established, but I want to grow the function in a high-impact market where execution and vision directly drive business outcomes."
                rows={3}
                className="bg-slate-950/50 border-slate-700/50 text-white placeholder-slate-500 focus-visible:border-orange-400/50"
              />
            </div>
          </Card>

          {/* Company research */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-400"></div>
            <p className="text-[13px] font-semibold text-orange-300/70">Section 3 of 4</p>
          </div>
          <Card className="border-white/10 bg-slate-900/40 p-6 sm:p-8 space-y-6">
            <p className="text-[13px] font-semibold text-slate-300 mb-4">
              Company Research
            </p>

            <div>
              <Label htmlFor="company-context" className="block text-[13px] font-semibold text-slate-200 mb-2">
                What's happening at this company right now?
              </Label>
              <p className="text-[12px] text-slate-400 mb-3">
                Recent funding, product launches, reorganization, market moves.
              </p>
              <Textarea
                id="company-context"
                placeholder="Recent news, strategy shifts, product announcements..."
                defaultValue="Figma closed a $200M Series D at $20B valuation last quarter. They're expanding into enterprise collaboration (Figma Dev Mode and API expansions). Major FY focus is expanding international (Europe, APAC) and landing more enterprise customers. Just announced partnership with Adobe ecosystem."
                rows={4}
                className="bg-slate-950/50 border-slate-700/50 text-white placeholder-slate-500 focus-visible:border-orange-400/50"
              />
            </div>

            <div>
              <Label htmlFor="role-fit" className="block text-[13px] font-semibold text-slate-200 mb-2">
                Why this role matters to their strategy
              </Label>
              <p className="text-[12px] text-slate-400 mb-3">
                Connect the role to company moves. What problem are they solving?
              </p>
              <Textarea
                id="role-fit"
                placeholder="How does this role support their current priorities?"
                defaultValue="VP Engineering at Figma needs to scale backend infrastructure for 10x user growth (enterprise push + international). They need someone who's built scalable systems and can drive technical vision while collaborating with Product."
                rows={3}
                className="bg-slate-950/50 border-slate-700/50 text-white placeholder-slate-500 focus-visible:border-orange-400/50"
              />
            </div>
          </Card>

          {/* Objections */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-400"></div>
            <p className="text-[13px] font-semibold text-orange-300/70">Section 4 of 4</p>
          </div>
          <Card className="border-white/10 bg-slate-900/40 p-6 sm:p-8 space-y-6">
            <p className="text-[13px] font-semibold text-slate-300 mb-4">
              Anticipated Objections
            </p>

            <div>
              <Label htmlFor="objection" className="block text-[13px] font-semibold text-slate-200 mb-2">
                What concerns might they have?
              </Label>
              <p className="text-[12px] text-slate-400 mb-3">
                Gaps in background, technical skills, industry experience?
              </p>
              <Textarea
                id="objection"
                placeholder="Gaps you anticipate they might raise..."
                defaultValue="'You haven't worked in design tools.' 'Figma moves fast; infrastructure isn't your background.' 'You've always been at larger companies.'"
                rows={3}
                className="bg-slate-950/50 border-slate-700/50 text-white placeholder-slate-500 focus-visible:border-orange-400/50"
              />
            </div>

            <div>
              <Label htmlFor="objection-response" className="block text-[13px] font-semibold text-slate-200 mb-2">
                How you'll address it
              </Label>
              <p className="text-[12px] text-slate-400 mb-3">
                Your proof point or reframe.
              </p>
              <Textarea
                id="objection-response"
                placeholder="Your response framing and proof..."
                defaultValue="'I've scaled infrastructure at Stripe from 10K to 1M+ transactions/sec. Design tools are a specific domain, but distributed systems is the challenge.' 'Speed is infrastructure + strong process. I've built both - velocity comes from good defaults, not chaos.'"
                rows={3}
                className="bg-slate-950/50 border-slate-700/50 text-white placeholder-slate-500 focus-visible:border-orange-400/50"
              />
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              className="border-slate-700 text-slate-300 hover:text-white hover:border-slate-600"
            >
              Save as draft
            </Button>
            <Button type="submit">
              Save interview prep
            </Button>
          </div>
        </form>

        {/* Next steps */}
        <Card className="border-white/10 bg-slate-900/40 p-6 sm:p-8">
          <p className="text-[13px] font-semibold text-slate-300 mb-3">Next: Review your prep</p>
          <p className="text-[14px] leading-relaxed text-slate-100 mb-4">
            Come back here 24 hours before your interview. Practice your opening, your company narrative, and your objection responses. You're aiming for natural conversation, not recitation.
          </p>
          <Link
            href="/demo/prep-communications"
            className="inline-flex px-4 py-2 text-[13px] font-semibold text-orange-300 hover:text-orange-200 transition-colors"
          >
            Move to communications prep →
          </Link>
        </Card>
      </div>
    </div>
  )
}
