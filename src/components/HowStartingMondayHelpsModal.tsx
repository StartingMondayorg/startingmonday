'use client'

import { useMemo, useState } from 'react'

type SituationOption =
  | 'planning'
  | 'laid_off'
  | 'active_search'
  | 'monitoring'
  | 'unsure'

type RoleOption = 'c_suite' | 'vp_technology' | 'director_to_vp' | 'other_senior'

type SourceOption = 'resume' | 'linkedin' | 'both' | 'skip'

type NeedOption =
  | 'target_companies'
  | 'interview_prep'
  | 'outreach'
  | 'weekly_discipline'
  | 'full_os'

type IntakeState = {
  situation: SituationOption
  role: RoleOption
  source: SourceOption
  companies: string
  need: NeedOption
}

const ROLE_SUGGESTIONS: Record<RoleOption, string[]> = {
  c_suite: ['ServiceNow', 'Workday', 'Snowflake', 'Databricks', 'CrowdStrike'],
  vp_technology: ['Atlassian', 'HubSpot', 'Datadog', 'Elastic', 'Cloudflare'],
  director_to_vp: ['GitLab', 'Okta', 'Twilio', 'PagerDuty', 'HashiCorp'],
  other_senior: ['Adobe', 'Salesforce', 'Zoom', 'Intuit', 'Autodesk'],
}

const STEP_COUNT = 5

export function HowStartingMondayHelpsModal({ sourcePage = '/' }: { sourcePage?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [intake, setIntake] = useState<IntakeState>({
    situation: 'planning',
    role: 'c_suite',
    source: 'skip',
    companies: '',
    need: 'target_companies',
  })

  const suggestedCompanies = useMemo(() => {
    const typed = intake.companies
      .split(/\n|,/)
      .map((company) => company.trim())
      .filter(Boolean)
    const base = ROLE_SUGGESTIONS[intake.role]
    return [...typed, ...base.filter((company) => !typed.includes(company))].slice(0, 8)
  }, [intake.companies, intake.role])

  const canContinue = useMemo(() => {
    if (step === 4) return true
    return true
  }, [step])

  const open = () => {
    setIsOpen(true)
    setStep(1)
  }

  const close = () => setIsOpen(false)
  const next = () => setStep((current) => Math.min(STEP_COUNT, current + 1))
  const back = () => setStep((current) => Math.max(1, current - 1))

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="inline-flex items-center justify-center bg-primary text-primary-foreground text-[14px] font-bold px-6 py-3 rounded hover:bg-muted transition-colors"
      >
        See how Starting Monday can help me
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4" role="dialog" aria-modal="true" aria-label="Starting Monday intake modal">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-primary mb-2">Step {step} of {STEP_COUNT}</p>
                <h3 className="text-[24px] font-bold text-foreground leading-tight">See how Starting Monday can help you</h3>
                <p className="text-[14px] text-muted-foreground mt-2">Tell us a little about your search. We will suggest target companies, show where Starting Monday helps most, and give you a sample first brief.</p>
                <p className="text-[12px] text-muted-foreground mt-1">About 2 minutes. No credit card. Private by default.</p>
              </div>
              <button type="button" onClick={close} className="text-muted-foreground hover:text-foreground text-[12px] font-semibold">Close</button>
            </div>

            {step === 1 && (
              <fieldset>
                <legend className="text-[14px] font-semibold text-foreground">What best describes your situation?</legend>
                <p className="text-[12px] text-muted-foreground mt-1 mb-3">This helps us tailor suggestions and the first brief.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    ['planning', 'Still employed and planning'],
                    ['laid_off', 'Recently laid off'],
                    ['active_search', 'Actively searching'],
                    ['monitoring', 'Monitoring the market'],
                    ['unsure', 'Not sure yet'],
                  ].map(([value, label]) => (
                    <label key={value} className="rounded border border-border p-3 text-[13px] text-foreground hover:border-primary/30 cursor-pointer">
                      <input
                        type="radio"
                        name="situation"
                        value={value}
                        checked={intake.situation === value}
                        onChange={() => setIntake((current) => ({ ...current, situation: value as SituationOption }))}
                        className="mr-2"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {step === 2 && (
              <fieldset>
                <legend className="text-[14px] font-semibold text-foreground">What role are you targeting?</legend>
                <p className="text-[12px] text-muted-foreground mt-1 mb-3">Choose the level closest to your next move.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    ['c_suite', 'CIO / CTO / CISO'],
                    ['vp_technology', 'VP of Technology'],
                    ['director_to_vp', 'Director to VP'],
                    ['other_senior', 'Other senior leadership role'],
                  ].map(([value, label]) => (
                    <label key={value} className="rounded border border-border p-3 text-[13px] text-foreground hover:border-primary/30 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value={value}
                        checked={intake.role === value}
                        onChange={() => setIntake((current) => ({ ...current, role: value as RoleOption }))}
                        className="mr-2"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {step === 3 && (
              <fieldset>
                <legend className="text-[14px] font-semibold text-foreground">What should we use to tailor this?</legend>
                <p className="text-[12px] text-muted-foreground mt-1 mb-3">Use one or both. You can skip this and continue.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    ['resume', 'Upload resume'],
                    ['linkedin', 'Paste LinkedIn profile'],
                    ['both', 'Upload both'],
                    ['skip', 'Skip for now'],
                  ].map(([value, label]) => (
                    <label key={value} className="rounded border border-border p-3 text-[13px] text-foreground hover:border-primary/30 cursor-pointer">
                      <input
                        type="radio"
                        name="source"
                        value={value}
                        checked={intake.source === value}
                        onChange={() => setIntake((current) => ({ ...current, source: value as SourceOption }))}
                        className="mr-2"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {step === 4 && (
              <div>
                <label htmlFor="company-input" className="text-[14px] font-semibold text-foreground block">Any companies already on your list?</label>
                <p className="text-[12px] text-muted-foreground mt-1 mb-3">Optional. Add a few if you have them. We will suggest more based on your background and target role.</p>
                <textarea
                  id="company-input"
                  value={intake.companies}
                  onChange={(event) => setIntake((current) => ({ ...current, companies: event.target.value }))}
                  placeholder="Example: Adobe, Workday, ServiceNow"
                  className="w-full min-h-[84px] rounded border border-border bg-background text-foreground text-[13px] p-3 outline-none focus:border-primary/30"
                />
                <div className="mt-4 rounded border border-border bg-background/60 p-3">
                  <p className="text-[12px] font-semibold text-primary mb-2">Suggested target companies</p>
                  <p className="text-[12px] text-muted-foreground mb-2">Accept, reject, or edit these. This is a starting point.</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedCompanies.map((company) => (
                      <span key={company} className="text-[12px] px-2 py-1 rounded bg-muted border border-border text-foreground">{company}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <fieldset>
                <legend className="text-[14px] font-semibold text-foreground">What do you want most right now?</legend>
                <p className="text-[12px] text-muted-foreground mt-1 mb-3">Pick the biggest immediate win.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    ['target_companies', 'Better target companies'],
                    ['interview_prep', 'Better interview prep'],
                    ['outreach', 'Better outreach'],
                    ['weekly_discipline', 'Better weekly discipline'],
                    ['full_os', 'A full search operating system'],
                  ].map(([value, label]) => (
                    <label key={value} className="rounded border border-border p-3 text-[13px] text-foreground hover:border-primary/30 cursor-pointer">
                      <input
                        type="radio"
                        name="need"
                        value={value}
                        checked={intake.need === value}
                        onChange={() => setIntake((current) => ({ ...current, need: value as NeedOption }))}
                        className="mr-2"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button type="button" onClick={back} disabled={step === 1} className="px-4 py-2 rounded border border-border text-[13px] text-foreground disabled:opacity-40">
                  Back
                </button>
                {step < STEP_COUNT ? (
                  <button type="button" onClick={next} disabled={!canContinue} className="px-4 py-2 rounded bg-primary hover:bg-primary/90 text-[13px] font-semibold text-primary-foreground disabled:opacity-40">
                    Next
                  </button>
                ) : (
                  <a
                    href={`/concierge?program=beta&from=landing-help-modal&source=${encodeURIComponent(sourcePage)}`}
                    className="px-4 py-2 rounded bg-primary hover:bg-primary/90 text-[13px] font-semibold text-primary-foreground"
                  >
                    Get my suggestions
                  </a>
                )}
              </div>
              <button type="button" onClick={close} className="text-[12px] text-muted-foreground hover:text-foreground">Skip and browse</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}