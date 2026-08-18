'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Recruiter = { name: string; focus: string }
type Suggestions = { companies: string[]; recruiters: Recruiter[] }

const DISMISS_KEY = 'sm_suggestions_dismissed'

export function SuggestionCards() {
  const [data, setData]       = useState<Suggestions | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [added, setAdded]     = useState<Set<string>>(new Set())
  const [adding, setAdding]   = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(DISMISS_KEY)) {
      setDismissed(true)
      setLoading(false)
      return
    }
    fetch('/api/suggestions')
      .then(r => r.json())
      .then((d: Suggestions) => {
        if (!d.companies?.length && !d.recruiters?.length) {
          setDismissed(true)
        } else {
          setData(d)
        }
      })
      .catch(() => setDismissed(true))
      .finally(() => setLoading(false))
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  async function quickAdd(name: string) {
    if (adding || added.has(name)) return
    setAdding(name)
    try {
      const res = await fetch('/api/companies/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok || res.status === 409) {
        setAdded(prev => new Set([...prev, name]))
      }
    } catch {
      // silent - user can still use the link fallback
    } finally {
      setAdding(null)
    }
  }

  if (dismissed || (!loading && !data)) return null
  if (loading) return null
  if (!data) return null

  return (
    <div className="bg-white border border-slate-200 rounded overflow-hidden mb-8">
      <div className="px-6 py-[18px] border-b border-slate-200 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400">
            Suggestions
          </span>
          <p className="text-[12px] text-slate-400 mt-0.5">Based on your profile. Dismiss when you no longer need this.</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="text-[12px] text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer p-0"
        >
          Dismiss
        </button>
      </div>

      <div className="divide-y divide-slate-50">

        {data.companies.length > 0 && (
          <div className="px-6 py-5">
            <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-3">
              Companies to add to your watchlist
            </p>
            <div className="flex flex-wrap gap-2">
              {data.companies.map(name => {
                const isAdded   = added.has(name)
                const isAdding  = adding === name
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => quickAdd(name)}
                    disabled={isAdded || isAdding}
                    className={[
                      'inline-flex items-center gap-1.5 text-[13px] border rounded-full px-3.5 py-1.5 transition-colors cursor-pointer',
                      isAdded
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 cursor-default'
                        : isAdding
                        ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-wait'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <span className="text-[11px]">{isAdded ? '✓' : isAdding ? '...' : '+'}</span>
                    {name}
                  </button>
                )
              })}
            </div>
            {added.size > 0 && (
              <p className="text-[12px] text-slate-400 mt-3">
                Added to your pipeline.{' '}
                <Link href="/dashboard" className="text-slate-600 underline underline-offset-2">
                  View companies
                </Link>
                {' '}to add their career page URLs.
              </p>
            )}
          </div>
        )}

        {data.recruiters.length > 0 && (
          <div className="px-6 py-5">
            <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-3">
              Executive search firms for your sector
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.recruiters.map(r => (
                <div key={r.name} className="flex items-start gap-2">
                  <span className="text-[13px] font-semibold text-slate-900 shrink-0">{r.name}</span>
                  <span className="text-[13px] text-slate-400">{r.focus}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
