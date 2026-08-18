'use client'

import { useState } from 'react'
import Link from 'next/link'

type Props = {
  bundleSlug: string
  buttonLabel?: string
  fallbackHref?: string
}

export function CoachBundleCheckoutButton({
  bundleSlug,
  buttonLabel = 'Start bundle checkout',
  fallbackHref = '/partners#apply',
}: Props) {
  const [loading, setLoading] = useState(false)
  const [discountCode, setDiscountCode] = useState('')
  const [error, setError] = useState('')

  async function handleCheckout() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/billing/checkout/micro-product-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bundleSlug,
          discountCode: discountCode.trim() || undefined,
        }),
      })

      const data = await res.json().catch(() => ({ error: `Server error ${res.status}` }))

      if (data.error) {
        setError(data.error)
        return
      }

      if (!data.url) {
        setError('No checkout URL returned. Try again in a moment.')
        return
      }

      window.location.assign(data.url)
    } catch {
      setError('Bundle checkout request failed. Try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
        <label htmlFor={`discount-code-${bundleSlug}`} className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600 mb-1.5">
          Discount code
        </label>
        <input
          id={`discount-code-${bundleSlug}`}
          type="text"
          value={discountCode}
          onChange={(event) => setDiscountCode(event.target.value)}
          placeholder="Enter code (optional)"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>

      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className="w-full inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-800 text-[13px] font-semibold px-4 py-2 hover:bg-slate-100 transition-colors disabled:opacity-60"
      >
        {loading ? 'Opening checkout...' : buttonLabel}
      </button>

      {error && (
        <p className="text-[12px] text-amber-700 leading-relaxed">
          {error}{' '}
          <Link href={fallbackHref} className="underline underline-offset-2 font-semibold">
            Get purchase help
          </Link>
          .
        </p>
      )}
    </div>
  )
}
