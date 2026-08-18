import Link from 'next/link'
import { deleteNotes } from './actions'
import ProfileResumeUpload from './profile-resume-upload'
import ProfileLinkedinUpload from './profile-linkedin-upload'
import CareerVerificationPanel from '@/app/components/CareerVerificationPanel'
import type { CareerEntry } from '@/app/components/CareerVerificationPanel'
import StarStoriesPanel from '@/app/(dashboard)/dashboard/_components/StarStoriesPanel'
import type { StarStory } from '@/app/(dashboard)/dashboard/_components/StarStoriesPanel'

type Props = {
  resumeText: string
  beyondResume: string
  beyondResumePlaceholder: string
  linkedinUrl: string
  linkedinHeadline: string
  linkedinAbout: string
  targetTitles: string
  roleType: string
  currentTitle: string
  currentCompany: string
  careerEntries: CareerEntry[] | null
  starStories: StarStory[]
  securityFrameworks: string
  boardSecurityMaturity: string
  productTypeExp: string
  productAchievement: string
  productMetric: string
  cooMandateTypes: string[]
  cooCeoPartnership: string
  ctoTechnicalFlavor: string[]
  ctoArchitectureDecision: string
  dataMaturityOrientation: string
  dataPlatformBuilt: string
  digitalBackgroundType: string
  digitalTransformationDelivered: string
  briefingTime: string
  activeDays: string[]
  briefingTimezone: string | null
  briefingEmail: string
  userEmail: string
}

export function ProfileAdvancedPanels(props: Props) {
  return (
    <>
      <details id="section-linkedin-upload" className="rounded border border-slate-200 px-4 py-3">
        <summary className="cursor-pointer text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500">
          LinkedIn profile upload
        </summary>
        <div className="pt-3">
          <label className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-1.5 block">
            LinkedIn profile PDF
          </label>
          <p className="text-[12px] text-slate-400 mb-2">Upload a LinkedIn PDF to extract summary, experience, and headline.</p>
          <ProfileLinkedinUpload />
        </div>
      </details>

      <section id="section-resume">
        <h2 className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-3">Resume and interview evidence</h2>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="resume_text" className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500">Resume / career history</label>
          {props.resumeText.length >= 200 && (
            <Link href="/dashboard/profile/tailor" className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-colors">Tailor for a role &rarr;</Link>
          )}
        </div>
        <p className="text-[12px] text-slate-400 mb-2">Upload your resume or paste the text below.</p>
        <ProfileResumeUpload />
        <textarea id="resume_text" name="resume_text" rows={12} maxLength={100000} defaultValue={props.resumeText} placeholder="Paste your resume text here, or upload a PDF/DOCX above…" className="w-full border border-slate-200 rounded px-3 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 resize-y leading-relaxed font-mono text-[12px]" />
        <p className="mt-1.5 text-[12px] text-slate-400">Used in interview prep briefs and AI context.</p>
        <CareerVerificationPanel initialEntries={props.careerEntries} resumeText={props.resumeText} />
      </section>

      <div>
        <label htmlFor="beyond_resume" className="block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-1.5">Beyond the resume</label>
        <textarea id="beyond_resume" name="beyond_resume" rows={4} defaultValue={props.beyondResume} placeholder={props.beyondResumePlaceholder} className="w-full border border-slate-200 rounded px-3 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 resize-none leading-relaxed" />
        <p className="mt-1.5 text-[12px] text-slate-400">Extra context for briefs and outreach.</p>
      </div>

      <details className="rounded border border-slate-200 px-4 py-3">
        <summary className="cursor-pointer text-[11px] font-bold tracking-[0.08em] uppercase text-orange-500">Interview stories</summary>
        <div className="pt-3">
          <p className="text-[12px] text-slate-400 mb-3">Save STAR stories for the prep brief.</p>
          <StarStoriesPanel initial={props.starStories} />
        </div>
      </details>

      <details className="rounded border border-slate-200 px-4 py-3">
        <summary className="cursor-pointer text-[11px] font-bold tracking-[0.08em] uppercase text-orange-500">Role context</summary>
        <div className="pt-4 flex flex-col gap-6">
          <p className="text-[12px] text-slate-400">Add details that do not fit in your resume.</p>
          {props.roleType === 'ciso' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-1.5">Security frameworks implemented</label>
                <input type="hidden" name="security_frameworks" defaultValue={props.securityFrameworks} />
                <p className="mt-1.5 text-[12px] text-slate-400">Used to match your background to this company's compliance requirements in prep briefs.</p>
              </div>
              <div>
                <label htmlFor="board_security_maturity" className="block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-1.5">Board security maturity</label>
                <textarea id="board_security_maturity" name="board_security_maturity" rows={3} defaultValue={props.boardSecurityMaturity} placeholder="What was the board's security awareness when you started? What changed by the time you left?" className="w-full border border-slate-200 rounded px-3 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 resize-none leading-relaxed" />
              </div>
            </div>
          )}
          {props.roleType === 'cpo' && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-2">Product experience type</p>
                <div className="flex gap-4">
                  {(['B2C', 'B2B', 'Both'] as const).map(opt => <label key={opt} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="product_type_exp" value={opt} defaultChecked={props.productTypeExp === opt} className="accent-slate-900" /><span className="text-[13px] text-slate-700">{opt}</span></label>)}
                </div>
              </div>
              <div>
                <label htmlFor="product_achievement" className="block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-1.5">Key product achievement</label>
                <textarea id="product_achievement" name="product_achievement" rows={3} defaultValue={props.productAchievement} placeholder="What product are you most proud of and why? What user problem did it solve?" className="w-full border border-slate-200 rounded px-3 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 resize-none leading-relaxed" />
              </div>
              <div>
                <label htmlFor="product_metric" className="block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-1.5">Primary metric moved</label>
                <input id="product_metric" name="product_metric" type="text" defaultValue={props.productMetric} placeholder="+22% retention, 40% MAU growth..." className="w-full border border-slate-200 rounded px-3 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-400" />
              </div>
            </div>
          )}
          {props.roleType === 'coo' && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-2">Mandate type(s) sought</p>
                <div className="flex flex-col gap-2">
                  {(['Scaling', 'Turnaround', 'Post-M&A integration', 'Professionalization'] as const).map(opt => <label key={opt} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="coo_mandate_types" value={opt} defaultChecked={props.cooMandateTypes.includes(opt)} className="accent-slate-900" /><span className="text-[13px] text-slate-700">{opt}</span></label>)}
                </div>
              </div>
              <div>
                <label htmlFor="coo_ceo_partnership" className="block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-1.5">CEO partnership model</label>
                <textarea id="coo_ceo_partnership" name="coo_ceo_partnership" rows={3} defaultValue={props.cooCeoPartnership} placeholder="What is your model for the CEO-COO relationship?" className="w-full border border-slate-200 rounded px-3 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 resize-none leading-relaxed" />
              </div>
            </div>
          )}
          {props.roleType === 'cto' && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-2">Technical flavor</p>
                <div className="flex flex-col gap-2">
                  {(['Infrastructure', 'Product engineering', 'Platform', 'AI and ML'] as const).map(opt => <label key={opt} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="cto_technical_flavor" value={opt} defaultChecked={props.ctoTechnicalFlavor.includes(opt)} className="accent-slate-900" /><span className="text-[13px] text-slate-700">{opt}</span></label>)}
                </div>
              </div>
              <div>
                <label htmlFor="cto_architecture_decision" className="block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-1.5">Key architectural decision</label>
                <textarea id="cto_architecture_decision" name="cto_architecture_decision" rows={3} defaultValue={props.ctoArchitectureDecision} placeholder="What is the architectural decision you are most proud of?" className="w-full border border-slate-200 rounded px-3 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 resize-none leading-relaxed" />
              </div>
            </div>
          )}
          {props.roleType === 'cdo_data' && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-2">Data mandate orientation</p>
                <div className="flex gap-4">
                  {(['Governance-first', 'Products-first'] as const).map(opt => <label key={opt} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="data_maturity_orientation" value={opt} defaultChecked={props.dataMaturityOrientation === opt} className="accent-slate-900" /><span className="text-[13px] text-slate-700">{opt}</span></label>)}
                </div>
              </div>
              <div>
                <label htmlFor="data_platform_built" className="block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-1.5">Data platform built</label>
                <textarea id="data_platform_built" name="data_platform_built" rows={3} defaultValue={props.dataPlatformBuilt} placeholder="What platform did you build or inherit and transform?" className="w-full border border-slate-200 rounded px-3 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 resize-none leading-relaxed" />
              </div>
            </div>
          )}
          {props.roleType === 'cdo_digital' && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-2">Professional background</p>
                <div className="flex flex-col gap-2">
                  {(['Consulting', 'Operations', 'Marketing', 'Technology'] as const).map(opt => <label key={opt} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="digital_background_type" value={opt} defaultChecked={props.digitalBackgroundType === opt} className="accent-slate-900" /><span className="text-[13px] text-slate-700">{opt}</span></label>)}
                </div>
              </div>
              <div>
                <label htmlFor="digital_transformation_delivered" className="block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-1.5">Business transformation delivered</label>
                <textarea id="digital_transformation_delivered" name="digital_transformation_delivered" rows={3} defaultValue={props.digitalTransformationDelivered} placeholder="What business transformation did you drive?" className="w-full border border-slate-200 rounded px-3 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 resize-none leading-relaxed" />
              </div>
            </div>
          )}
        </div>
      </details>

      <details id="section-data-privacy" className="bg-white border border-slate-200 rounded p-6 max-w-xl mt-6">
        <summary className="cursor-pointer text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500">Data and privacy</summary>
        <div className="pt-5">
          <section id="section-briefing" className="mb-5">
            <h2 className="block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-3">Briefing setup</h2>
            <label htmlFor="briefing_time" className="block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-1.5">Daily briefing time</label>
            <input id="briefing_time" name="briefing_time" type="time" defaultValue={props.briefingTime} className="border border-slate-200 rounded px-3 py-2.5 text-[14px] text-slate-900 focus:outline-none focus:border-slate-400" />
            {props.briefingTimezone && <p className="mt-1.5 text-[12px] text-slate-400">{props.briefingTimezone}</p>}
            <div className="mt-4">
              <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-3">Briefing days</p>
              <div className="flex gap-2 flex-wrap">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <label key={day} className="flex items-center justify-center w-12 h-9 rounded text-[12px] font-semibold cursor-pointer border transition-colors border-slate-200 text-slate-400 hover:border-slate-400 has-[:checked]:bg-slate-900 has-[:checked]:text-white has-[:checked]:border-slate-900">
                    <input type="checkbox" name="briefing_days" value={day} defaultChecked={props.activeDays.includes(day)} className="sr-only" />
                    {day.slice(0, 3)}
                  </label>
                ))}
              </div>
            </div>
            <div id="briefing-email" className="mt-4">
              <label htmlFor="briefing_email" className="block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-1.5">Briefing delivery email</label>
              <input id="briefing_email" name="briefing_email" type="email" defaultValue={props.briefingEmail} placeholder={props.userEmail} className="w-full max-w-sm border border-slate-200 rounded px-3 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-400" />
              <p className="mt-1.5 text-[12px] text-slate-400">Optional. If set, all briefings and system emails are sent here instead of your login address.</p>
            </div>
          </section>

          <div className="mb-5">
            <p className="text-[12px] font-semibold text-slate-700 mb-1">Download your data</p>
            <a href="/api/profile/export" className="inline-block text-[13px] font-semibold text-slate-700 border border-slate-300 hover:border-slate-500 px-4 py-2 rounded transition-colors">Download your data</a>
          </div>
          <div className="border-t border-slate-100 pt-5">
            <p className="text-[12px] font-semibold text-slate-700 mb-1">Delete sensitive data</p>
            <p className="text-[12px] text-slate-500 leading-relaxed mb-3">Removes profile notes only. Your account and pipeline data remain unchanged.</p>
            <form action={deleteNotes}><button type="submit" className="text-[13px] font-semibold text-red-600 hover:text-red-700 border border-red-200 hover:border-red-400 px-4 py-2 rounded cursor-pointer bg-white transition-colors">Delete sensitive data</button></form>
          </div>
        </div>
      </details>
    </>
  )
}