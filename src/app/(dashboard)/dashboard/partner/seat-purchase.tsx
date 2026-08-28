'use client'
import Link from 'next/link'
import { useState } from 'react'
import { PRICING } from '@/lib/billing/pricing'
import { Button, Card, RadioGroup, RadioGroupItem } from '@/components/ui'
type Plan = 'passive' | 'active'

const SEAT_PLANS: Record<Plan, { name: string; pricePerSeat: number; description: string }> = {
  passive: {
    name: PRICING.passive.name,
    pricePerSeat: 39,
    description: 'Signal monitoring, daily briefing, pipeline tracking',
  },
  active: {
    name: PRICING.active.name,
    pricePerSeat: 89,
    description: 'Full AI prep briefs, outreach drafting, chat advisor',
  },
}

export function SeatPurchase({ seatsPurchased, seatsUsed }: {
  seatsPurchased: number
  seatsUsed: number
}) {
  const [plan, setPlan] = useState<Plan>('passive')
  const [quantity, setQuantity] = useState(3)
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout/seats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, quantity }),
      })
      const data = await res.json().catch(() => ({ error: `Server error ${res.status}` }))
      if (data.error) { alert(data.error); return }
      if (data.url) window.location.href = data.url
    } catch (e) {
      alert(`Checkout failed: ${e}`)
    } finally {
      setLoading(false)
    }
  }

  if (seatsPurchased > 0) {
    const seatsRemaining = seatsPurchased - seatsUsed
    return (
      <Card variant="default" className="p-6 mb-6">
        <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Client Seats</p>
        <div className="flex items-center gap-6 mb-4">
          <div>
            <p className="text-[28px] font-bold text-foreground">{seatsUsed} <span className="text-[16px] font-normal text-muted-foreground">/ {seatsPurchased}</span></p>
            <p className="text-[12px] text-muted-foreground mt-0.5">seats used</p>
          </div>
          {seatsRemaining > 0 ? (
            <p className="text-[13px] text-muted-foreground">
              {seatsRemaining} seat{seatsRemaining !== 1 ? 's' : ''} available. Invite clients from your <Link href="/settings/team" className="font-semibold text-foreground underline">team settings</Link>.
            </p>
          ) : (
            <p className="text-[13px] text-muted-foreground">
              All seats are in use. <Link href="/settings/billing" className="font-semibold text-foreground underline">Manage subscription</Link> to add more.
            </p>
          )}
        </div>
        <Button variant="outline" render={<Link href="/settings/team" />}>
          Manage client invites
        </Button>
      </Card>
    )
  }

  const selectedPlan = SEAT_PLANS[plan]
  const monthlyTotal = selectedPlan.pricePerSeat * quantity

  return (
    <Card variant="default" className="p-6 mb-6">
      <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-1">Coach Seats</p>
      <p className="text-[13px] text-muted-foreground mb-5 leading-relaxed">
        Purchase seats to activate Starting Monday for your clients. You pay monthly. Clients log in to their own account.
      </p>

      <RadioGroup
        value={plan}
        onValueChange={(value) => setPlan(value as Plan)}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5"
      >
        {(Object.entries(SEAT_PLANS) as [Plan, typeof SEAT_PLANS[Plan]][]).map(([key, p]) => (
          <label
            key={key}
            className={`flex items-start gap-3 text-left p-4 rounded border transition-colors cursor-pointer ${plan === key ? 'border-border bg-muted' : 'border-border hover:bg-muted'}`}
          >
            <RadioGroupItem value={key} className="mt-1" />
            <span>
              <p className="text-[14px] font-bold text-foreground">{p.name} <span className="text-[13px] font-normal text-muted-foreground">${p.pricePerSeat}/seat/mo</span></p>
              <p className="text-[12px] text-muted-foreground mt-0.5">{p.description}</p>
            </span>
          </label>
        ))}
      </RadioGroup>

      <div className="flex items-center gap-4 mb-5">
        <label className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground">Seats</label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
          >-</Button>
          <span className="text-[18px] font-bold text-foreground w-8 text-center">{quantity}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setQuantity(q => Math.min(20, q + 1))}
          >+</Button>
        </div>
        <p className="text-[15px] font-bold text-foreground ml-auto">${monthlyTotal}/mo</p>
      </div>

      <Button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className="w-full py-3"
      >
        {loading ? 'Redirecting...' : `Purchase ${quantity} ${selectedPlan.name} seat${quantity !== 1 ? 's' : ''}`}
      </Button>
    </Card>
  )
}
