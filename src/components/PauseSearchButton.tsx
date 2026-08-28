import { useState } from 'react'

export function PauseSearchButton() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(7)

  async function handlePause(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch('/api/billing/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      })
      if (!res.ok) throw new Error('Failed to pause search')
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handlePause} className="flex flex-col gap-2 mt-2">
      <label className="text-[12px] text-muted-foreground">Pause search for
        <select
          className="ml-2 border border-border rounded px-2 py-1 text-[13px]"
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          disabled={loading}
        >
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={30}>30 days</option>
        </select>
      </label>
      <button
        type="submit"
        className="bg-muted hover:bg-muted/90 text-muted-foreground text-[13px] font-semibold px-4 py-2 rounded transition-colors border-0 mt-1 w-fit"
        disabled={loading}
      >
        {loading ? 'Pausing...' : 'Pause Search'}
      </button>
      {success && <div className="text-success text-[12px] mt-1">Search paused. You’ll still get major alerts and a weekly digest.</div>}
      {error && <div className="text-destructive text-[12px] mt-1">{error}</div>}
      <div className="text-[11px] text-muted-foreground mt-1">You’ll still receive major signal alerts and a low-frequency digest. Search auto-resumes after the selected period.</div>
    </form>
  )
}
