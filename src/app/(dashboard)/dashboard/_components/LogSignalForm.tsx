'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Textarea } from '@/components/ui'
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
      <Button
        type="button"
        variant="link"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-muted-foreground"
      >
        + Log a signal
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
      <Textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Paste a news headline, LinkedIn post, press release, or anything relevant about this company…"
        rows={4}
        autoFocus
        disabled={loading}
        className="text-[13px] text-foreground resize-none leading-relaxed"
      />
      <Input
        type="url"
        value={sourceUrl}
        onChange={e => setSourceUrl(e.target.value)}
        placeholder="Source URL (optional)"
        disabled={loading}
        className="text-[13px] text-muted-foreground"
      />
      {error && <p className="text-[12px] text-destructive">{error}</p>}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          size="sm"
          disabled={!text.trim() || loading}
        >
          {loading ? 'Classifying…' : 'Add signal'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => { setOpen(false); setError('') }}
          className="text-muted-foreground"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
