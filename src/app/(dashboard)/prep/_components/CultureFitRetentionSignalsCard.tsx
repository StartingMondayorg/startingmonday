type SignalItem = {
  label: string
  why: string
}

const RETENTION_SIGNALS: SignalItem[] = [
  {
    label: 'Sponsor stability',
    why: 'The hiring sponsor and direct manager have clear runway and are not likely to churn in the next two quarters.',
  },
  {
    label: 'Mandate clarity',
    why: 'The first 6-12 month outcomes are explicit, measurable, and aligned across leadership interviews.',
  },
  {
    label: 'Decision velocity',
    why: 'Interview process, headcount approval, and cross-functional alignment move at a sustainable pace.',
  },
  {
    label: 'Operating cadence',
    why: 'The team has a reliable weekly execution rhythm instead of constant escalations and fire drills.',
  },
  {
    label: 'Change tolerance',
    why: 'Leaders can absorb disagreement and iteration without reverting to blame or politics.',
  },
]

const CULTURE_FIT_PROMPTS = [
  'What behavior gets rewarded here when priorities conflict?',
  'Where did the last person in this role get stuck?',
  'What would cause this role to be judged as successful at day 90 and day 365?',
]

export function CultureFitRetentionSignalsCard() {
  return (
    <div className="rounded-xl border border-orange-400/30 bg-orange-500/5 p-5 sm:p-6">
      <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-orange-300">First version: culture-fit + retention signals</p>
      <p className="mt-2 text-[14px] leading-relaxed text-slate-200">
        Use this as a decision-quality filter before you accept. A strong offer can still be a weak long-term fit if these signals are unclear.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">Retention signals</p>
          <ul className="mt-2 space-y-2">
            {RETENTION_SIGNALS.map((item) => (
              <li key={item.label} className="rounded-md border border-white/10 bg-slate-900/40 px-3 py-2.5">
                <p className="text-[13px] font-semibold text-slate-100">{item.label}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-400">{item.why}</p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">Culture-fit probe prompts</p>
          <ul className="mt-2 space-y-2">
            {CULTURE_FIT_PROMPTS.map((prompt) => (
              <li key={prompt} className="rounded-md border border-white/10 bg-slate-900/40 px-3 py-2.5 text-[13px] text-slate-200">
                {prompt}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] leading-relaxed text-slate-400">
            If answers are vague or inconsistent across interviewers, treat that as a retention risk signal.
          </p>
        </div>
      </div>
    </div>
  )
}
