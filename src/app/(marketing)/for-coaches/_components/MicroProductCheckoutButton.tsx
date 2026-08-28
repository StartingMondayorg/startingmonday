'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Alert, AlertDescription, Button } from '@/components/ui'
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
      <Button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={className ?? 'h-auto px-5 py-3 text-[14px] font-semibold'}
      >
        {loading ? 'Opening checkout...' : label}
      </Button>

      {error && (
        <Alert variant="warning" className="mt-3">
          <AlertDescription className="text-[12px]">
            {error}{' '}
            <Link href={fallbackHref} className="underline underline-offset-2 font-semibold">
              Get purchase help
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
