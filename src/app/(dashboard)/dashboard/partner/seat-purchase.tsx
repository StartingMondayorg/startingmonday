'use client'
import Link from 'next/link'
import { useState } from 'react'
import { PRICING } from '@/lib/billing/pricing'

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
      <div className="bg-white border border-slate-200 rounded p-6 mb-6">
        <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-3">Client Seats</p>
        <div className="flex items-center gap-6 mb-4">
          <div>
            <p className="text-[28px] font-bold text-slate-900">{seatsUsed} <span className="text-[16px] font-normal text-slate-400">/ {seatsPurchased}</span></p>
            <p className="text-[12px] text-slate-400 mt-0.5">seats used</p>
          </div>
          {seatsRemaining > 0 ? (
            <p className="text-[13px] text-slate-600">
              {seatsRemaining} seat{seatsRemaining !== 1 ? 's' : ''} available. Invite clients from your <Link href="/settings/team" className="font-semibold text-slate-900 underline">team settings</Link>.
            </p>
          ) : (
            <p className="text-[13px] text-slate-600">
              All seats are in use. <Link href="/settings/billing" className="font-semibold text-slate-900 underline">Manage subscription</Link> to add more.
            </p>
          )}
        </div>
        <Link
          href="/settings/team"
          className="inline-block text-[13px] font-semibold text-slate-700 border border-slate-200 rounded px-4 py-2 hover:bg-slate-50 transition-colors"
        >
          Manage client invites
        </Link>
      </div>
    )
  }

  const selectedPlan = SEAT_PLANS[plan]
  const monthlyTotal = selectedPlan.pricePerSeat * quantity

  return (
    <div className="bg-white border border-slate-200 rounded p-6 mb-6">
      <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-1">Coach Seats</p>
      <p className="text-[13px] text-slate-500 mb-5 leading-relaxed">
        Purchase seats to activate Starting Monday for your clients. You pay monthly. Clients log in to their own account.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {(Object.entries(SEAT_PLANS) as [Plan, typeof SEAT_PLANS[Plan]][]).map(([key, p]) => (
          <button
            key={key}
            type="button"
            onClick={() => setPlan(key)}
            className={`text-left p-4 rounded border transition-colors cursor-pointer ${plan === key ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:bg-slate-50'}`}
          >
            <p className="text-[14px] font-bold text-slate-900">{p.name} <span className="text-[13px] font-normal text-slate-500">${p.pricePerSeat}/seat/mo</span></p>
            <p className="text-[12px] text-slate-500 mt-0.5">{p.description}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 mb-5">
        <label className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400">Seats</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="w-8 h-8 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 text-[16px] font-bold cursor-pointer flex items-center justify-center"
          >-</button>
          <span className="text-[18px] font-bold text-slate-900 w-8 text-center">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity(q => Math.min(20, q + 1))}
            className="w-8 h-8 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 text-[16px] font-bold cursor-pointer flex items-center justify-center"
          >+</button>
        </div>
        <p className="text-[15px] font-bold text-slate-900 ml-auto">${monthlyTotal}/mo</p>
      </div>

      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-slate-900 text-white text-[14px] font-bold py-3 rounded border-0 cursor-pointer disabled:opacity-50 hover:bg-slate-700 transition-colors"
      >
        {loading ? 'Redirecting...' : `Purchase ${quantity} ${selectedPlan.name} seat${quantity !== 1 ? 's' : ''}`}
      </button>
    </div>
  )
}
