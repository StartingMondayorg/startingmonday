'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { UserSubscription } from '@/lib/billing/subscription'
import { PLANS, WAITLIST_PLANS } from '@/lib/billing/plans'
import type { BillingInterval } from '@/lib/billing/plans'
import { TIER_DISPLAY_NAMES } from '@/lib/billing/pricing'
import { MICRO_PRODUCT_DEFINITIONS, formatMicroProductPrice } from '@/lib/billing/micro-products'
import { Alert, AlertDescription, Badge, Button, Card, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, ToggleGroup, ToggleGroupItem } from '@/components/ui'
function fmtDate(d: Date | null) {
  if (!d) return null
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function BillingClient({ sub, hasStripeCustomer, accountEmail, accountName, isPlaced = false, canSeeAdminHeader }: {
  sub: UserSubscription
  hasStripeCustomer: boolean
  accountEmail: string
  accountName: string | null
  isPlaced?: boolean
  canSeeAdminHeader: boolean
}) {
  const [paused, setPaused] = useState(sub.isPaused)
  const [now] = useState(() => Date.now())
  const [pauseDays, setPauseDays] = useState(14)
  const [loading, setLoading] = useState<string | null>(null)
  const [interval, setInterval] = useState<BillingInterval>('monthly')
  const [portalError, setPortalError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [microLoading, setMicroLoading] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const highlightedAddOn = searchParams.get('addOn')

  async function handleCheckout(plan: 'passive' | 'active' | 'executive') {
    setLoading(plan)
    setActionError('')
    setActionMessage('')
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, interval }),
      })
      const data = await res.json().catch(() => ({ error: `Server error ${res.status}` }))
      if (data.error) { setActionError(data.error); return }
      if (!data.url) { setActionError('No checkout URL returned. Please try again.'); return }
      window.location.assign(data.url)
    } catch (e) {
      setActionError(`Checkout failed: ${e}`)
    } finally {
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading('portal')
    setPortalError('')
    setActionError('')
    setActionMessage('')
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const { url, error } = await res.json()
      if (error) {
        setPortalError(res.status === 404
          ? 'No Stripe billing record found for your account. Email support@startingmonday.app and we will sort it out.'
          : error)
        return
      }
      window.location.assign(url)
    } catch {
      setPortalError('Could not open billing portal right now. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  async function handlePause() {
    setLoading('pause')
    setActionError('')
    setActionMessage('')
    try {
      const res = await fetch('/api/billing/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: pauseDays }),
      })
      const { ok, error, pauseDays: appliedDays } = await res.json()
      if (error) { setActionError(error); return }
      if (ok) {
        setPaused(true)
        setActionMessage(`Subscription paused for ${appliedDays ?? pauseDays} days.`)
      }
    } catch {
      setActionError('Could not pause subscription right now. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  async function handleResume() {
    setLoading('resume')
    setActionError('')
    setActionMessage('')
    try {
      const res = await fetch('/api/billing/resume', { method: 'POST' })
      const { ok, error } = await res.json()
      if (error) { setActionError(error); return }
      if (ok) {
        setPaused(false)
        setActionMessage('Subscription resumed. Full access is active now.')
      }
    } catch {
      setActionError('Could not resume subscription right now. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  async function handleWaitlist(plan: string) {
    window.location.assign(`mailto:hello@startingmonday.app?subject=${encodeURIComponent(`${plan} plan interest`)}&body=${encodeURIComponent(`I am interested in the ${plan} plan. My account email is: ${accountEmail}`)}`)
  }

  async function handleMicroProductCheckout(slug: string) {
    setMicroLoading(slug)
    setActionError('')
    setActionMessage('')
    try {
      const res = await fetch('/api/billing/checkout/micro-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })
      const data = await res.json().catch(() => ({ error: `Server error ${res.status}` }))
      if (data.error) {
        setActionError(data.error)
        return
      }
      if (!data.url) {
        setActionError('No checkout URL returned. Please try again.')
        return
      }
      window.location.assign(data.url)
    } catch (e) {
      setActionError(`Add-on checkout failed: ${e}`)
    } finally {
      setMicroLoading(null)
    }
  }

  const trialDaysLeft = sub.trialEndsAt
    ? Math.max(0, Math.ceil((sub.trialEndsAt.getTime() - now) / 86_400_000))
    : null

  const planLabel = paused ? 'Paused'
    : sub.status === 'canceled' ? 'Canceled'
    : TIER_DISPLAY_NAMES[sub.tier] ?? sub.tier

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="bg-primary">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground"><span className="text-primary-foreground">Starting </span><span className="text-primary">Monday</span></span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-[13px] text-muted-foreground hover:text-primary-foreground transition-colors">
              Dashboard
            </Link>
            {canSeeAdminHeader && (
              <Link href="/dashboard/admin" className="text-[12px] font-semibold text-primary transition-colors">
                Admin
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-[26px] font-bold text-foreground mb-1">Billing</h1>
        <p className="text-[13px] text-muted-foreground mb-8">Manage your subscription and plan.</p>

        {/* Account */}
        <Card className="p-6 mb-6">
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3">Account</p>
          {accountName && (
            <p className="text-[15px] font-semibold text-foreground">{accountName}</p>
          )}
          <p className="text-[13px] text-muted-foreground">{accountEmail}</p>
        </Card>

        {/* Maintenance mode: placed user on active/executive tier */}
        {isPlaced && sub.isPaid && sub.tier !== 'passive' && sub.tier !== 'free' && !paused && (
          <Alert className="mb-6 flex items-start gap-4 bg-primary/10 border-primary/30 text-foreground">
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-foreground mb-1">You placed. Consider dropping to Monitor.</p>
              <AlertDescription className="text-[13px] text-muted-foreground leading-relaxed">
                Monitor ($49/mo) keeps your signal monitoring and weekly digest running without the active search tools.
                Most executives search again within 3 years. When you are ready, everything you built here will be waiting.
              </AlertDescription>
            </div>
            <Button
              type="button"
              onClick={handlePortal}
              disabled={loading === 'portal'}
              className="shrink-0"
            >
              {loading === 'portal' ? 'Loading...' : 'Manage plan'}
            </Button>
          </Alert>
        )}

        {/* Current status */}
        <Card className="p-6 mb-8">
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3">Current Plan</p>

          {sub.status === 'trialing' && trialDaysLeft != null && (
            <Alert variant="warning" className="mb-4">
              <AlertDescription>
                {trialDaysLeft <= 3
                  ? <><strong>{trialDaysLeft === 0 ? 'Your trial ends today.' : `${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left.`}</strong> When it ends, your signal history and company intelligence disappear. Subscribe below to keep everything you have built.</>
                  : <>You are in your free trial - <strong>{trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining</strong>. The signal history and company intelligence you are building disappears when the trial ends. Subscribe below to keep it.</>
                }
              </AlertDescription>
            </Alert>
          )}
          {paused && (
            <Alert variant="warning" className="mb-4">
              <AlertDescription>
                Your subscription is paused. Resume below to restore access to AI briefs, outreach drafting, and chat.
              </AlertDescription>
            </Alert>
          )}
          {sub.status === 'past_due' && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                Your last payment failed. Update your payment method to restore access.
              </AlertDescription>
            </Alert>
          )}
          {sub.status === 'canceled' && (
            <Alert variant="warning" className="mb-4">
              <AlertDescription>
                Your subscription was canceled.{sub.periodEnd ? ` Access ended ${fmtDate(sub.periodEnd)}.` : ''}{' '}
                Subscribe below to restore access to AI briefs, outreach drafting, and chat.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-4">
            <div>
              <p className="text-[18px] font-bold text-foreground capitalize">{planLabel}</p>
              <p className="text-[13px] text-muted-foreground capitalize">{sub.status.replace('_', ' ')}</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {paused && hasStripeCustomer && (
                <Button
                  type="button"
                  onClick={handleResume}
                  disabled={loading === 'resume'}
                >
                  {loading === 'resume' ? 'Resuming…' : 'Resume subscription'}
                </Button>
              )}
              {sub.isPaid && !paused && hasStripeCustomer && (
                <>
                  <Select
                    value={String(pauseDays)}
                    onValueChange={(v) => setPauseDays(Number(v))}
                    disabled={!!loading}
                  >
                    <SelectTrigger aria-label="Pause duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7d</SelectItem>
                      <SelectItem value="14">14d</SelectItem>
                      <SelectItem value="30">30d</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePause}
                    disabled={!!loading}
                  >
                    {loading === 'pause' ? 'Pausing…' : 'Pause'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePortal}
                    disabled={loading === 'portal'}
                  >
                    {loading === 'portal' ? 'Loading…' : 'Manage subscription'}
                  </Button>
                </>
              )}
            </div>
          </div>
          {sub.isPaid && !paused && hasStripeCustomer && (
            <p className="mt-3 text-[12px] text-muted-foreground">
              <strong className="font-semibold text-muted-foreground">Pause</strong> stops billing temporarily - your data and pipeline stay intact.{' '}
              <strong className="font-semibold text-muted-foreground">Cancel</strong> (via Manage subscription) ends your subscription entirely.
            </p>
          )}
          {portalError && (
            <Alert variant="destructive" className="mt-3">
              <AlertDescription>{portalError}</AlertDescription>
            </Alert>
          )}
          {actionError && (
            <Alert variant="destructive" className="mt-3">
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          )}
          {actionMessage && (
            <Alert variant="success" className="mt-3">
              <AlertDescription>{actionMessage}</AlertDescription>
            </Alert>
          )}
        </Card>

        {/* Plans */}
        {!sub.isPaid && (
          <>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
              One hour with an executive coach runs $300 to $500. Starting Monday is $199 a month and runs every day.
            </p>

            <div className="flex items-center gap-3 mb-6">
              <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground">Choose a plan</p>
              <ToggleGroup
                value={[interval]}
                onValueChange={(v) => v[0] && setInterval(v[0] as BillingInterval)}
                className="ml-auto"
                variant="outline"
              >
                <ToggleGroupItem value="monthly" className="px-4 text-[12px] font-semibold">
                  Monthly
                </ToggleGroupItem>
                <ToggleGroupItem value="annual" className="px-4 text-[12px] font-semibold">
                  Annual
                </ToggleGroupItem>
              </ToggleGroup>
              {interval === 'annual' && (
                <Badge variant="success">2 months free</Badge>
              )}
            </div>

            {/* Subscribable plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {(Object.entries(PLANS) as [keyof typeof PLANS, (typeof PLANS)[keyof typeof PLANS]][]).map(([key, plan]) => {
                const amount = interval === 'annual' ? plan.annualAmount : plan.amount
                const monthlyEquiv = interval === 'annual' ? Math.round(plan.annualAmount / 12) : null
                const isFeatured = key === 'active'
                return (
                  <Card key={key} className={`p-6 ${isFeatured ? 'ring-2 ring-border' : ''}`}>
                    {isFeatured && (
                      <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-primary mb-3">Most popular</p>
                    )}
                    <p className="text-[20px] font-bold text-foreground">{plan.name}</p>
                    <p className="text-[28px] font-bold text-foreground mt-1">
                      ${interval === 'annual' ? (monthlyEquiv! / 100).toFixed(0) : (amount / 100).toFixed(0)}
                      <span className="text-[14px] font-normal text-muted-foreground">/mo</span>
                    </p>
                    {interval === 'annual' && monthlyEquiv && (
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        billed as ${(amount / 100).toFixed(0)}/yr · <span className="text-success">Save ${((plan.amount * 12 - plan.annualAmount) / 100).toFixed(0)}</span>
                      </p>
                    )}
                    <p className="text-[13px] text-muted-foreground mt-2 mb-4 leading-relaxed">{plan.description}</p>
                    <ul className="mb-5 flex flex-col gap-1.5">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                          <span className="text-muted-foreground shrink-0 mt-0.5">+</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      type="button"
                      onClick={() => handleCheckout(key as 'passive' | 'active' | 'executive')}
                      disabled={loading === key}
                      variant={isFeatured ? 'default' : 'secondary'}
                      className="w-full"
                    >
                      {loading === key ? 'Redirecting…' : `Subscribe to ${plan.name}`}
                    </Button>
                  </Card>
                )
              })}
            </div>

            {/* Waitlist plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.entries(WAITLIST_PLANS) as [string, typeof WAITLIST_PLANS[keyof typeof WAITLIST_PLANS]][]).map(([key, plan]) => (
                <Card key={key} className="p-6 opacity-80">
                  <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Coming soon</p>
                  <p className="text-[20px] font-bold text-foreground">{plan.name}</p>
                  <p className="text-[28px] font-bold text-foreground mt-1">
                    ${(plan.amount / 100).toFixed(0)}
                    <span className="text-[14px] font-normal text-muted-foreground">/mo</span>
                  </p>
                  <p className="text-[13px] text-muted-foreground mt-2 mb-4 leading-relaxed">{plan.description}</p>
                  <ul className="mb-5 flex flex-col gap-1.5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                        <span className="text-muted-foreground shrink-0 mt-0.5">+</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    onClick={() => handleWaitlist(plan.name)}
                    variant="secondary"
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Card>
              ))}
            </div>
          </>
        )}

        <Card className="p-6 mt-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground">Executive add-ons</p>
              <p className="text-[13px] text-muted-foreground mt-1">Micro-products for role-specific outcomes. Purchased separately from plan tier.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MICRO_PRODUCT_DEFINITIONS.filter((item) => item.channel === 'executives').map((item) => {
              const highlighted = highlightedAddOn === item.slug
              return (
                <Card key={item.slug} className={`p-4 ${highlighted ? 'ring-2 ring-primary/30 bg-primary/40' : 'bg-muted'}`}>
                  <p className="text-[14px] font-semibold text-foreground">{item.name}</p>
                  <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">{item.summary}</p>
                  <p className="text-[13px] font-semibold text-foreground mt-3">{formatMicroProductPrice(item.amountCents, item.defaultInterval)}</p>
                  <Button
                    type="button"
                    onClick={() => handleMicroProductCheckout(item.slug)}
                    disabled={microLoading === item.slug}
                    className="mt-3 w-full"
                  >
                    {microLoading === item.slug ? 'Redirecting…' : 'Buy add-on'}
                  </Button>
                </Card>
              )
            })}
          </div>
        </Card>
      </main>
    </div>
  )
}

