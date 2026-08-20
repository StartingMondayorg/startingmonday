'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  positioning: string
  targetTitles: string
  roleType: string
  currentTitle: string
  initialHeadline: string
  initialAbout: string
}

export function LinkedInGenerator({ positioning, targetTitles, roleType, currentTitle, initialHeadline, initialAbout }: Props) {
  const [loading, setLoading] = useState(false)
  const [headline, setHeadline] = useState(initialHeadline)
  const [about, setAbout] = useState(initialAbout)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/narrative/generate-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positioning_summary: positioning,
          target_titles: targetTitles.split(',').map(s => s.trim()).filter(Boolean),
          role_type: roleType,
          current_title: currentTitle,
        }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setHeadline(data.headline ?? '')
      setAbout(data.about ?? '')
      setSaved(true)
    } catch {
      setError('Request failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!positioning) {
    return (
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-1.5">LinkedIn content</p>
        <p className="text-[12px] text-slate-400">Add your positioning summary first, then generate your LinkedIn headline and About.</p>
      </div>
    )
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500">LinkedIn content</p>
        <Button
          type="button"
          variant="link"
          onClick={handleGenerate}
          disabled={loading}
          className="h-auto p-0 text-[11px] font-semibold text-orange-600 hover:text-orange-700"
        >
          {loading ? 'Generating...' : headline ? 'Regenerate' : 'Generate from positioning'}
        </Button>
      </div>

      {error && <p className="text-[12px] text-red-600 mb-3">{error}</p>}

      {saved && (
        <p className="text-[12px] text-green-700 mb-3">Saved to your profile.</p>
      )}

      {headline && (
        <div className="mb-3">
          <p className="text-[10px] font-bold tracking-[0.08em] uppercase text-slate-400 mb-1">Headline</p>
          <p className="text-[13px] text-slate-700 bg-slate-50 rounded px-3 py-2 leading-relaxed">{headline}</p>
          <p className="mt-1 text-[11px] text-slate-400">{headline.length} / 220 characters</p>
        </div>
      )}

      {about && (
        <div>
          <p className="text-[10px] font-bold tracking-[0.08em] uppercase text-slate-400 mb-1">About section</p>
          <div className="text-[13px] text-slate-700 bg-slate-50 rounded px-3 py-2.5 leading-relaxed whitespace-pre-wrap">{about}</div>
        </div>
      )}

      {!headline && !loading && (
        <p className="text-[12px] text-slate-400">Generate a LinkedIn headline and About section grounded in your positioning.</p>
      )}
    </div>
  )
}
