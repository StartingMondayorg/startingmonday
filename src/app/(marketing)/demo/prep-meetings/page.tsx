import Link from 'next/link'

export const metadata = {
  title: 'Meetings Strategy - Starting Monday',
  description: 'Plan your conversation strategy and relationship progression.',
}

export default function DemoMeetingsPrepPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      {/* Task navigation */}
      <nav className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            <Link
              href="/demo/prep-interview"
              className="flex-shrink-0 px-4 py-3 text-[13px] font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-300 transition-colors whitespace-nowrap"
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
              className="flex-shrink-0 px-4 py-3 text-[13px] font-medium border-b-2 border-orange-400 text-orange-300 transition-colors whitespace-nowrap"
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
              Meetings Strategy
            </h1>
            <p className="text-[13px] font-semibold text-slate-400">
              12-18 minutes
            </p>
          </div>
          <p className="text-[16px] leading-relaxed text-slate-300 max-w-2xl">
            Plan your conversation sequence from introduction through offer decision.
          </p>
        </div>

        {/* Research insight card */}
        <div className="rounded-2xl border border-orange-400/30 bg-orange-500/5 p-6 sm:p-8">
          <p className="text-[15px] leading-relaxed text-slate-100 mb-4">
            "The leaders who managed their search best mapped out a conversation sequence: intro → deeper context → specific role → decision. They didn't walk into calls without a plan. They knew what information they needed at each stage."
          </p>
          <div className="pt-4 border-t border-orange-400/20">
            <p className="text-[13px] font-semibold text-orange-300 mb-2">How this helps:</p>
            <p className="text-[13px] text-orange-300/80">A structured plan prevents you from meandering conversations or asking the wrong questions at the wrong time. Each phase builds toward a decision, so you move faster and close stronger.</p>
          </div>
        </div>

        {/* Form sections */}
        <form className="space-y-8">
          {/* Phase 1 */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-400"></div>
            <p className="text-[13px] font-semibold text-orange-300/70">Section 1 of 4</p>
          </div>
          <fieldset className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 sm:p-8 space-y-6">
            <legend className="text-[13px] font-semibold text-slate-300 mb-4">
              Phase 1: Introduction Meetings
            </legend>

            <div>
              <label htmlFor="intro-goal" className="block text-[13px] font-semibold text-slate-200 mb-2">
                Your goal in an intro call
              </label>
              <textarea
                id="intro-goal"
                defaultValue="Build connection and trust. Understand their world: what they care about, current priorities, team structure. Find common ground. Set up a potential second meeting if there's natural fit."
                rows={3}
                className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
              />
            </div>

            <div>
              <label htmlFor="intro-flow" className="block text-[13px] font-semibold text-slate-200 mb-2">
                Your intro call flow
              </label>
              <textarea
                id="intro-flow"
                defaultValue="1. 'How did you end up at [Company]?' (Learn their story)
2. 'What's exciting/challenging about your role right now?' (Priorities)
3. [Share 1 relevant story from my background that shows I understand their world]
4. 'What would success look like in your role in the next year?'
5. Close: 'I'd like to keep the conversation going. Would you be open to connecting in a few weeks?' (Leave door open)"
                rows={4}
                className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
              />
            </div>
          </fieldset>

          {/* Phase 2 */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-400"></div>
            <p className="text-[13px] font-semibold text-orange-300/70">Section 2 of 4</p>
          </div>
          <fieldset className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 sm:p-8 space-y-6">
            <legend className="text-[13px] font-semibold text-slate-300 mb-4">
              Phase 2: Role-Fit Meetings
            </legend>

            <div>
              <label htmlFor="rolefit-goal" className="block text-[13px] font-semibold text-slate-200 mb-2">
                Your goal in a role-fit call
              </label>
              <textarea
                id="rolefit-goal"
                defaultValue="Explore if a specific role exists or is emerging. Understand the team structure, mandate, and timeline. Determine if there's mutual interest in moving forward."
                rows={2}
                className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
              />
            </div>

            <div>
              <label htmlFor="rolefit-questions" className="block text-[13px] font-semibold text-slate-200 mb-2">
                Your key questions
              </label>
              <textarea
                id="rolefit-questions"
                defaultValue="- What's the org structure under you? Who owns what?
- What's the mandate for this role in the next 2-3 years?
- What's the current biggest challenge in your team?
- Is this a newly created role or is someone in it now?
- Timeline: When would you need to fill this?"
                rows={4}
                className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
              />
            </div>
          </fieldset>

          {/* Phase 3 */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-400"></div>
            <p className="text-[13px] font-semibold text-orange-300/70">Section 3 of 4</p>
          </div>
          <fieldset className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 sm:p-8 space-y-6">
            <legend className="text-[13px] font-semibold text-slate-300 mb-4">
              Phase 3: Formal Interviews
            </legend>

            <div>
              <label htmlFor="interview-prep" className="block text-[13px] font-semibold text-slate-200 mb-2">
                Interview preparation approach
              </label>
              <textarea
                id="interview-prep"
                defaultValue="3-4 hours minimum prep per interview. Review their latest funding, product announcements, leadership team changes. Prepare 2-3 questions that show I understand their business. Practice my opening positioning. Mock objection handling."
                rows={3}
                className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
              />
            </div>
          </fieldset>

          {/* Phase 4 */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-400"></div>
            <p className="text-[13px] font-semibold text-orange-300/70">Section 4 of 4</p>
          </div>
          <fieldset className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 sm:p-8 space-y-6">
            <legend className="text-[13px] font-semibold text-slate-300 mb-4">
              Phase 4: Offer & Decision
            </legend>

            <div>
              <label htmlFor="eval-criteria" className="block text-[13px] font-semibold text-slate-200 mb-2">
                How you'll evaluate an offer
              </label>
              <textarea
                id="eval-criteria"
                defaultValue="Role scope: Can I influence product direction? Team size: Reporting structure and hiring freedom. Growth: Market potential and company trajectory. Impact: Are we solving real problems? Culture: Do I believe in their mission? Comp: Salary + equity + benefits competitive with market."
                rows={3}
                className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
              />
            </div>
          </fieldset>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between pt-4">
            <button
              type="button"
              className="px-6 py-3 text-[13px] font-semibold text-slate-300 hover:text-white border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
            >
              Save as draft
            </button>
            <button
              type="submit"
              className="px-6 py-3 text-[13px] font-semibold bg-orange-500 text-slate-900 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Save meetings strategy
            </button>
          </div>
        </form>

        {/* Next steps */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 sm:p-8">
          <p className="text-[13px] font-semibold text-slate-300 mb-3">Next: Communications prep</p>
          <p className="text-[14px] leading-relaxed text-slate-100 mb-4">
            With your meetings strategy mapped, you're ready to craft your outreach messages.
          </p>
          <Link
            href="/demo/prep-communications"
            className="inline-flex px-4 py-2 text-[13px] font-semibold text-orange-300 hover:text-orange-200 transition-colors"
          >
            Move to communications prep →
          </Link>
        </div>
      </div>
    </div>
  )
}
