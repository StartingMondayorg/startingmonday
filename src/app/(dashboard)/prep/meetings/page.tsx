import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CultureFitRetentionSignalsCard } from '@/app/(dashboard)/prep/_components/CultureFitRetentionSignalsCard'
import { MeetingDebriefPersistencePanel } from '@/app/(dashboard)/prep/_components/MeetingDebriefPersistencePanel'

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
        <h1 className="text-[32px] font-bold tracking-tight text-white sm:text-[40px]">
          Meetings Strategy
        </h1>
        <p className="text-[16px] leading-relaxed text-slate-300 max-w-2xl">
          Plan your conversation sequence from introduction through offer decision.
        </p>
      </div>

      {/* Research insight card */}
      <div className="rounded-2xl border border-orange-400/30 bg-orange-500/5 p-6 sm:p-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-orange-300 mb-3">
          From coaching research
        </p>
        <p className="text-[15px] leading-relaxed text-slate-100">
          "The leaders who managed their search best didn't just react to meetings. They mapped out a conversation sequence: intro meeting to explore, deeper context meeting, specific role conversation, then decision conversation. They knew what they were solving for in each meeting before it happened."
        </p>
      </div>

      {/* Form sections */}
      <form className="space-y-8">
        {/* Introduction meetings */}
        <fieldset className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 sm:p-8 space-y-6">
          <legend className="text-[13px] font-semibold uppercase tracking-[0.1em] text-slate-300 mb-4">
            Phase 1: Introduction Meetings
          </legend>

          <div>
            <label htmlFor="intro-goal" className="block text-[13px] font-semibold text-slate-200 mb-2">
              Your goal in an intro call
            </label>
            <p className="text-[12px] text-slate-400 mb-3">
              E.g., understand their business, learn about their team, find a specific point of connection.
            </p>
            <textarea
              id="intro-goal"
              placeholder="What are you trying to learn or establish in a first conversation?"
              rows={3}
              className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
            />
          </div>

          <div>
            <label htmlFor="intro-flow" className="block text-[13px] font-semibold text-slate-200 mb-2">
              Your intro call flow
            </label>
            <p className="text-[12px] text-slate-400 mb-3">
              How you'll move through the conversation (e.g., context → their role → your background → shared interests).
            </p>
            <textarea
              id="intro-flow"
              placeholder="Your conversation structure and talking points..."
              rows={4}
              className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
            />
          </div>

          <div>
            <label htmlFor="intro-close" className="block text-[13px] font-semibold text-slate-200 mb-2">
              How you'll close an intro call
            </label>
            <p className="text-[12px] text-slate-400 mb-3">
              What does success look like? A second meeting? An email intro?
            </p>
            <textarea
              id="intro-close"
              placeholder="Your closing approach: what's the next step?"
              rows={2}
              className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
            />
          </div>
        </fieldset>

        {/* Deeper context meetings */}
        <fieldset className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 sm:p-8 space-y-6">
          <legend className="text-[13px] font-semibold uppercase tracking-[0.1em] text-slate-300 mb-4">
            Phase 2: Role-Fit Meetings
          </legend>

          <div>
            <label htmlFor="rolefit-goal" className="block text-[13px] font-semibold text-slate-200 mb-2">
              Your goal in a role-fit call
            </label>
            <p className="text-[12px] text-slate-400 mb-3">
              Explore if a specific role exists, understand the team and mandate.
            </p>
            <textarea
              id="rolefit-goal"
              placeholder="What are you trying to determine about a specific role?"
              rows={3}
              className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
            />
          </div>

          <div>
            <label htmlFor="rolefit-questions" className="block text-[13px] font-semibold text-slate-200 mb-2">
              Your key questions
            </label>
            <p className="text-[12px] text-slate-400 mb-3">
              What you need to know to determine fit (team, mandate, timeline).
            </p>
            <textarea
              id="rolefit-questions"
              placeholder="Role scope, team structure, reporting relationship, priorities, timeline..."
              rows={4}
              className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
            />
          </div>

          <div>
            <label htmlFor="rolefit-sell" className="block text-[13px] font-semibold text-slate-200 mb-2">
              How you'll position yourself
            </label>
            <p className="text-[12px] text-slate-400 mb-3">
              Why you're the right fit for this role specifically.
            </p>
            <textarea
              id="rolefit-sell"
              placeholder="Your relevant background, relevant wins, why you understand their challenge..."
              rows={3}
              className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
            />
          </div>
        </fieldset>

        {/* Interview meetings */}
        <fieldset className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 sm:p-8 space-y-6">
          <legend className="text-[13px] font-semibold uppercase tracking-[0.1em] text-slate-300 mb-4">
            Phase 3: Formal Interviews
          </legend>

          <div>
            <label htmlFor="interview-prep" className="block text-[13px] font-semibold text-slate-200 mb-2">
              Interview preparation approach
            </label>
            <p className="text-[12px] text-slate-400 mb-3">
              How you prepare (research, practice, conversation strategy).
            </p>
            <textarea
              id="interview-prep"
              placeholder="Your prep routine before formal interviews..."
              rows={3}
              className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
            />
          </div>

          <div>
            <label htmlFor="decision-timeline" className="block text-[13px] font-semibold text-slate-200 mb-2">
              Timeline expectations
            </label>
            <p className="text-[12px] text-slate-400 mb-3">
              How many interviews? What's your expected timeline?
            </p>
            <textarea
              id="decision-timeline"
              placeholder="Expected interview stages, timeline, decision points..."
              rows={2}
              className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
            />
          </div>
        </fieldset>

        {/* Offer & negotiation */}
        <fieldset className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 sm:p-8 space-y-6">
          <legend className="text-[13px] font-semibold uppercase tracking-[0.1em] text-slate-300 mb-4">
            Phase 4: Offer & Decision
          </legend>

          <CultureFitRetentionSignalsCard />

          <div>
            <label htmlFor="eval-criteria" className="block text-[13px] font-semibold text-slate-200 mb-2">
              How you'll evaluate an offer
            </label>
            <p className="text-[12px] text-slate-400 mb-3">
              Compensation, role scope, team, growth opportunity, culture fit?
            </p>
            <textarea
              id="eval-criteria"
              placeholder="Your key evaluation criteria for accepting an offer..."
              rows={3}
              className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
            />
          </div>

          <div>
            <label htmlFor="negotiation-strategy" className="block text-[13px] font-semibold text-slate-200 mb-2">
              Negotiation approach
            </label>
            <p className="text-[12px] text-slate-400 mb-3">
              What you'll negotiate on, your walkaway points?
            </p>
            <textarea
              id="negotiation-strategy"
              placeholder="What matters most to you: salary, title, scope, start date, flex options?"
              rows={2}
              className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
            />
          </div>
        </fieldset>

        <fieldset className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 sm:p-8 space-y-6">
          <legend className="text-[13px] font-semibold uppercase tracking-[0.1em] text-slate-300 mb-4">
            Meeting Debrief (Any Meeting)
          </legend>

          <MeetingDebriefPersistencePanel />
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
          With your meetings strategy mapped, you're ready to craft your outreach messages. How will you introduce yourself and move a conversation forward?
        </p>
        <Link
          href="/prep/communications"
          className="inline-flex px-4 py-2 text-[13px] font-semibold text-orange-300 hover:text-orange-200 transition-colors"
        >
          Move to communications prep →
        </Link>
      </div>
    </div>
  )
}
