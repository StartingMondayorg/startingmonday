'use client'
import { useState } from 'react'

const FAQS = [
  {
    q: 'How do I get started?',
    a: 'Add your first target company, upload your resume, and set your target titles on the Profile page. That gives the AI enough context to generate useful briefings and prep briefs. Set your Search Level (C-Suite, VP/SVP, or Board) so every AI output is calibrated to your tier. Then set your daily briefing time so you get a morning email whenever something changes.',
  },
  {
    q: 'My briefing hasn\'t arrived - what\'s wrong?',
    a: 'Check three things. First, confirm your delivery time and timezone are set in Profile - if they\'re blank, nothing sends. Second, check your spam or promotions folder, especially on first delivery. Third, briefings only send when there\'s something worth sending - if your pipeline is empty or your companies have had no recent activity, the briefing may skip that day. Add at least two target companies with career page URLs to start seeing consistent delivery.',
  },
  {
    q: 'My scan shows no results - is something broken?',
    a: 'Not necessarily. Three reasons a scan returns no results: (1) No job titles matching yours were found on the career page that day - the most common reason. The scanner checks your target titles against the page; if nothing matches, it\'s silent. (2) The career page blocked our scanner - some companies use Cloudflare or similar bot protection. We flag this if it persists. (3) The scan hasn\'t run yet - we scan each company shortly after you add it, then every few days. Check the "Last scanned" date on the company detail page.',
  },
  {
    q: 'Is my search confidential?',
    a: 'Yes. Starting Monday has no employer network. Nothing you add - your resume, your pipeline, your target companies - is ever visible to any employer unless you initiate contact. There is no matching marketplace. No employer sees your profile. Your data is stored in your account only and is never used to train AI models.',
  },
  {
    q: 'How does the AI know my situation?',
    a: 'Every AI feature - the daily briefing, prep briefs, strategy brief, and the chat advisor - reads your profile before responding: your resume, target titles, target sectors, current pipeline with stages, active contacts, and overdue follow-ups. The more complete your profile, the more specific and useful the output. A half-filled profile produces generic advice. A complete one produces advice about your actual situation.',
  },
  {
    q: 'What is Search Level?',
    a: 'Search Level tells the AI what tier of role you are targeting: C-Suite, VP/SVP, or Board/Advisor. Set it on your Profile page. Every AI feature - prep briefs, strategy, outreach drafting, and the advisor - calibrates to that level. A CISO brief reads differently than a VP of Engineering brief.',
  },
  {
    q: 'What is the daily briefing?',
    a: 'Each morning, Starting Monday scans your target companies for new job postings that match your target titles, checks for any new signals (funding, leadership changes), and emails you a concise brief - what changed overnight and what to do about it. You set the delivery time and days in Profile.',
  },
  {
    q: 'How does company scanning work?',
    a: 'When you add a company with a career page URL, the system fetches and analyzes that page within a few minutes. It scores each job posting against your target titles (0-10) and flags strong matches. Scans repeat every few days automatically. You can also trigger a rescan from the company detail page.',
  },
  {
    q: 'What is the Strategy Brief?',
    a: 'The Strategy Brief is a one-time AI synthesis of your positioning - your target roles, sectors, narrative, and outreach approach - based on your profile and the companies you\'re tracking. Run it from the dashboard. Regenerate it any time your search focus shifts.',
  },
  {
    q: 'What is the AI Career Advisor?',
    a: 'The AI Career Advisor is a conversational assistant built into the dashboard. It has full visibility into your pipeline, contacts, and overdue follow-ups. Ask it to move a company to a new stage, log notes from a call, set a follow-up reminder, or look up who you know at a company. It also answers strategic questions - how to frame a gap, what to say in an outreach, which roles to prioritize.',
  },
  {
    q: 'How do I upload my resume?',
    a: 'Go to Profile and click "Upload PDF or DOCX." The text is extracted and stored as context for all AI features - briefings, interview prep briefs, and the chat. If your PDF has custom fonts and uploads garbled, re-export it from Word or Google Docs first.',
  },
  {
    q: 'What is Resume Tailoring?',
    a: 'On the Resume Tailor page, paste a job description and click Tailor. You get a rewritten resume matched to that role - language aligned to the job, weak bullets tightened, sections reordered by relevance. Then run the Quality Check: it scores the result for ATS match, gives a recruiter grade, a hiring manager grade, and lists the specific bullets to strengthen before you send it.',
  },
  {
    q: 'What do the pipeline stages mean?',
    a: 'Watching: tracking but not yet active. Researching: actively learning, likely reaching out soon. In Process: active conversations underway. Interviewing: at least one interview scheduled or completed. Offer: offer received. Move companies through stages as your search progresses.',
  },
  {
    q: 'How do Actions Due work?',
    a: 'When you add a follow-up action to a company (e.g. "Send thank you note - Friday"), it appears in Actions Due on the dashboard when the date arrives. Click the action text to edit it. Click Done to dismiss it.',
  },
  {
    q: 'What is the difference between Monitor, Active, and Executive?',
    a: 'Monitor ($49/mo) includes pipeline tracking for up to 25 companies, company signal intelligence across news, 8-K filings, executive moves, funding rounds, and career pages, plus a weekly signal digest and contact tracker. Active ($199/mo) adds AI Interview Prep Briefs, the Search Strategy Brief, AI Chat advisor, outreach drafting, resume tailoring, and the daily morning briefing. Executive ($499/mo) adds an unlimited company pipeline, 2x daily career page scanning, immediate pattern and exec departure alerts, Opus-grade prep briefs, salary intelligence, and the recruiter tracker. All plans include a 30-day free trial.',
  },
  {
    q: 'How do I manage my subscription?',
    a: 'Click Billing in the nav. You can upgrade, downgrade, or cancel from the Stripe billing portal. Cancellation takes effect at the end of your current billing period - you keep full access until then.',
  },
  {
    q: 'My question isn\'t here - how do I get help?',
    a: 'Email rothschild@startingmonday.app and you\'ll hear back within one business day. During the alpha, expect fast responses - your feedback directly shapes the product.',
  },
]

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="divide-y divide-slate-100">
      {FAQS.map((faq, i) => (
        <div key={i}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
          >
            <span className="text-[14px] font-semibold text-slate-900 pr-4">{faq.q}</span>
            <span className="text-slate-400 text-[18px] shrink-0 leading-none">
              {open === i ? '−' : '+'}
            </span>
          </button>
          {open === i && (
            <div className="px-6 pb-5">
              <p className="text-[14px] text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
