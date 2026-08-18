'use client'

import { useState } from 'react'
import Link from 'next/link'

type Props = {
  slug: string
  label?: string
  fallbackHref?: string
  className?: string
}

export function MicroProductCheckoutButton({
  slug,
  label = 'Buy now',
  fallbackHref = '/partners#apply',
  className,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCheckout() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/billing/checkout/micro-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })

      const data = await res.json().catch(() => ({ error: `Server error ${res.status}` }))

      if (data.error) {
        setError('Checkout is temporarily unavailable for this product. Use the alternate link below and we will help you complete the order.')
        return
      }

      if (!data.url) {
        setError('No checkout URL returned. Try again in a moment.')
        return
      }

      window.location.assign(data.url)
    } catch {
      setError('Checkout request failed. Try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={
          className ??
          'inline-flex items-center rounded-lg bg-slate-900 text-white text-[14px] font-semibold px-5 py-3 hover:bg-slate-700 transition-colors disabled:opacity-60'
        }
      >
        {loading ? 'Opening checkout...' : label}
      </button>

      {error && (
        <p className="mt-3 text-[12px] text-amber-700 leading-relaxed">
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
