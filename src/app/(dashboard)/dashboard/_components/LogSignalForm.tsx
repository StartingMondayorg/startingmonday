'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function LogSignalForm({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || loading) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/signals/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, text, sourceUrl: sourceUrl.trim() || undefined }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.')
      setLoading(false)
      return
    }

    setText('')
    setSourceUrl('')
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[12px] font-semibold text-slate-500 hover:text-slate-700 transition-colors"
      >
        + Log a signal
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Paste a news headline, LinkedIn post, press release, or anything relevant about this company…"
        rows={4}
        autoFocus
        disabled={loading}
        className="w-full border border-slate-200 rounded px-3 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 resize-none leading-relaxed disabled:opacity-50"
      />
      <input
        type="url"
        value={sourceUrl}
        onChange={e => setSourceUrl(e.target.value)}
        placeholder="Source URL (optional)"
        disabled={loading}
        className="w-full border border-slate-200 rounded px-3 py-2.5 text-[13px] text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 disabled:opacity-50"
      />
      {error && <p className="text-[12px] text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!text.trim() || loading}
          className="text-[13px] font-semibold text-white bg-slate-900 border-0 rounded px-4 py-2 cursor-pointer hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Classifying…' : 'Add signal'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError('') }}
          className="text-[12px] text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
