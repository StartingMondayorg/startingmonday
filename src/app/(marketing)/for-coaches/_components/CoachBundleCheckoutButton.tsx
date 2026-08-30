'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Alert, AlertDescription, Button, Card, Input, Label } from '@/components/ui'
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
      <Card className="gap-1.5 p-3">
        <Label htmlFor={`discount-code-${bundleSlug}`} className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Discount code
        </Label>
        <Input
          id={`discount-code-${bundleSlug}`}
          type="text"
          value={discountCode}
          onChange={(event) => setDiscountCode(event.target.value)}
          placeholder="Enter code (optional)"
          className="text-[13px]"
        />
      </Card>

      <Button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        variant="outline"
        className="w-full text-[13px]"
      >
        {loading ? 'Opening checkout...' : buttonLabel}
      </Button>

      {error && (
        <Alert variant="warning">
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
