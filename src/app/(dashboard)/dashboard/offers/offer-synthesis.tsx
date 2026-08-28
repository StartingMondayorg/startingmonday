'use client'
import { useState } from 'react'
import { Alert, AlertDescription, Button, Card } from '@/components/ui'
type OfferInput = {
  name: string
  sector?: string | null
  offer_role_title?: string | null
  offer_base?: number | null
  offer_bonus_pct?: number | null
  offer_signing?: number | null
  offer_equity?: string | null
  offer_notes?: string | null
  offer_decision_factors?: string | null
}

export function OfferSynthesis({ offers }: { offers: OfferInput[] }) {
  const [synthesis, setSynthesis] = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  async function generate() {
    setLoading(true)
    setError('')
    setSynthesis('')
    try {
      const res = await fetch('/api/offer-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offers }),
      })
      const data = await res.json()
      if (!res.ok) { setError('Failed to generate. Try again.'); return }
      setSynthesis(data.synthesis)
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (offers.length === 0) return null

  return (
    <Card className="mt-6 py-0">
      <div className="px-6 py-[18px] border-b border-border flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Decision synthesis</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">Claude reads your offer data and decision factors and tells you where the real tension is.</p>
        </div>
        {!synthesis && (
          <Button onClick={generate} disabled={loading} className="shrink-0">
            {loading ? 'Thinking...' : 'Help me decide'}
          </Button>
        )}
        {synthesis && (
          <Button onClick={generate} disabled={loading} variant="ghost" size="sm" className="shrink-0">
            {loading ? 'Thinking...' : 'Refresh'}
          </Button>
        )}
      </div>
      {error && (
        <div className="px-6 py-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
      {loading && !synthesis && (
        <div className="px-6 py-6 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse inline-block" />
          <span className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse inline-block [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse inline-block [animation-delay:300ms]" />
        </div>
      )}
      {synthesis && (
        <div className="px-6 py-5">
          <p className="text-[14px] text-foreground leading-relaxed">{synthesis}</p>
        </div>
      )}
    </Card>
  )
}
