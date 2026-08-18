'use client'
import { useState } from 'react'

const INTEREST_OPTIONS = [
  'Executive coaching integration',
  'Coach firm rollout (multiple coaches)',
  'Coach + client referral model',
  'Search firm / retained firm',
  'Outplacement services',
  'PE operating partner network',
  'Relocation firm partnership',
  'Other',
]

const INPUT_CLS = 'w-full border border-slate-200 rounded px-3 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-400'
const LABEL_CLS = 'block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-1.5'

type PartnersFormProps = {
  introLabel?: string
  introNote?: string
  defaultInterest?: string
  companyPlaceholder?: string
  emailPlaceholder?: string
  rolePlaceholder?: string
  notesPlaceholder?: string
}

export function PartnersForm({
  introLabel = 'Coach partner application',
  introNote = 'Short form. Clear next step.',
  defaultInterest = 'Executive coaching integration',
  companyPlaceholder = 'Acme Executive Coaching',
  emailPlaceholder = 'jane@acmecoaching.com',
  rolePlaceholder = 'Founder, Executive Coach',
  notesPlaceholder = 'Client count, practice model, timeline...',
}: PartnersFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement).value
    try {
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: get('name'),
          email: get('email'),
          company: get('company'),
          role: get('role'),
          interests: get('interests'),
          how_heard: get('how_heard'),
        }),
      })
      if (!res.ok) throw new Error('Submission failed')
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Email us directly at partners@startingmonday.app.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="border border-emerald-200 bg-emerald-50 rounded p-6">
        <p className="text-[15px] font-semibold text-emerald-800 mb-1">Application received.</p>
        <p className="text-[13px] text-emerald-700">Check your inbox. We will follow up within 2 business days with your partner next steps.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <p className="mb-2 text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400">{introLabel}</p>
      <p className="mb-6 text-[13px] text-slate-500">{introNote}</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="p-name" className={LABEL_CLS}>Full name</label>
            <input id="p-name" name="name" type="text" required placeholder="Jane Smith" className={INPUT_CLS} />
          </div>
          <div>
            <label htmlFor="p-company" className={LABEL_CLS}>Practice or company</label>
            <input id="p-company" name="company" type="text" required placeholder={companyPlaceholder} className={INPUT_CLS} />
          </div>
        </div>
        <div>
          <label htmlFor="p-email" className={LABEL_CLS}>Work email</label>
          <input id="p-email" name="email" type="email" required placeholder={emailPlaceholder} className={INPUT_CLS} />
        </div>
        <div>
          <label htmlFor="p-role" className={LABEL_CLS}>Your role</label>
          <input id="p-role" name="role" type="text" required placeholder={rolePlaceholder} className={INPUT_CLS} />
        </div>
        <div>
          <label htmlFor="p-interests" className={LABEL_CLS}>Partnership model</label>
          <select id="p-interests" name="interests"
            defaultValue={defaultInterest}
            className="w-full border border-slate-200 rounded px-3 py-2.5 text-[14px] text-slate-900 focus:outline-none focus:border-slate-400 bg-white">
            {INTEREST_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="p-how-heard" className={LABEL_CLS}>
            Anything we should know before we reply? <span className="font-normal text-slate-300">(optional)</span>
          </label>
          <input id="p-how-heard" name="how_heard" type="text" placeholder={notesPlaceholder}
            className={INPUT_CLS} />
        </div>
        {error && <p className="text-[13px] text-red-600">{error}</p>}
        <button type="submit" disabled={loading}
          className="bg-slate-900 text-white text-[14px] font-semibold px-6 py-3 rounded cursor-pointer border-0 disabled:opacity-50 hover:bg-slate-700 transition-colors mt-2">
          {loading ? 'Sending...' : 'Apply now'}
        </button>
      </form>
    </div>
  )
}
