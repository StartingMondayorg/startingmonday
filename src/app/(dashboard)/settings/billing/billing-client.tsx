'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { UserSubscription } from '@/lib/billing/subscription'
import { PLANS, WAITLIST_PLANS } from '@/lib/billing/plans'
import type { BillingInterval } from '@/lib/billing/plans'
import { TIER_DISPLAY_NAMES } from '@/lib/billing/pricing'
import { MICRO_PRODUCT_DEFINITIONS, formatMicroProductPrice } from '@/lib/billing/micro-products'

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
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400"><span className="text-white">Starting </span><span className="text-orange-500">Monday</span></span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-[13px] text-slate-300 hover:text-white transition-colors">
              Dashboard
            </Link>
            {canSeeAdminHeader && (
              <Link href="/dashboard/admin" className="text-[12px] font-semibold text-orange-400 hover:text-orange-300 transition-colors">
                Admin
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-[26px] font-bold text-slate-900 mb-1">Billing</h1>
        <p className="text-[13px] text-slate-500 mb-8">Manage your subscription and plan.</p>

        {/* Account */}
        <div className="bg-white border border-slate-200 rounded p-6 mb-6">
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-3">Account</p>
          {accountName && (
            <p className="text-[15px] font-semibold text-slate-900">{accountName}</p>
          )}
          <p className="text-[13px] text-slate-500">{accountEmail}</p>
        </div>

        {/* Maintenance mode: placed user on active/executive tier */}
        {isPlaced && sub.isPaid && sub.tier !== 'passive' && sub.tier !== 'free' && !paused && (
          <div className="bg-orange-50 border border-orange-200 rounded p-5 mb-6 flex items-start gap-4">
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-slate-900 mb-1">You placed. Consider dropping to Monitor.</p>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Monitor ($49/mo) keeps your signal monitoring and weekly digest running without the active search tools.
                Most executives search again within 3 years. When you are ready, everything you built here will be waiting.
              </p>
            </div>
            <button
              type="button"
              onClick={handlePortal}
              disabled={loading === 'portal'}
              className="shrink-0 text-[13px] font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors border-0 rounded px-4 py-2 cursor-pointer disabled:opacity-50"
            >
              {loading === 'portal' ? 'Loading...' : 'Manage plan'}
            </button>
          </div>
        )}

        {/* Current status */}
        <div className="bg-white border border-slate-200 rounded p-6 mb-8">
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-3">Current Plan</p>

          {sub.status === 'trialing' && trialDaysLeft != null && (
            <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded text-[13px] text-amber-800">
              {trialDaysLeft <= 3
                ? <><strong>{trialDaysLeft === 0 ? 'Your trial ends today.' : `${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left.`}</strong> When it ends, your signal history and company intelligence disappear. Subscribe below to keep everything you have built.</>
                : <>You are in your free trial - <strong>{trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining</strong>. The signal history and company intelligence you are building disappears when the trial ends. Subscribe below to keep it.</>
              }
            </div>
          )}
          {paused && (
            <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded text-[13px] text-amber-800">
              Your subscription is paused. Resume below to restore access to AI briefs, outreach drafting, and chat.
            </div>
          )}
          {sub.status === 'past_due' && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded text-[13px] text-red-700">
              Your last payment failed. Update your payment method to restore access.
            </div>
          )}
          {sub.status === 'canceled' && (
            <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded text-[13px] text-amber-800">
              Your subscription was canceled.{sub.periodEnd ? ` Access ended ${fmtDate(sub.periodEnd)}.` : ''}{' '}
              Subscribe below to restore access to AI briefs, outreach drafting, and chat.
            </div>
          )}

          <div className="flex items-center gap-4">
            <div>
              <p className="text-[18px] font-bold text-slate-900 capitalize">{planLabel}</p>
              <p className="text-[13px] text-slate-500 capitalize">{sub.status.replace('_', ' ')}</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {paused && hasStripeCustomer && (
                <button
                  type="button"
                  onClick={handleResume}
                  disabled={loading === 'resume'}
                  className="text-[13px] font-semibold text-white bg-slate-900 border-0 rounded px-4 py-2 hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
                >
                  {loading === 'resume' ? 'Resuming…' : 'Resume subscription'}
                </button>
              )}
              {sub.isPaid && !paused && hasStripeCustomer && (
                <>
                  <select
                    value={pauseDays}
                    onChange={e => setPauseDays(Number(e.target.value))}
                    aria-label="Pause duration"
                    className="text-[13px] text-slate-700 border border-slate-200 rounded px-2.5 py-2 bg-white"
                    disabled={!!loading}
                  >
                    <option value={7}>7d</option>
                    <option value={14}>14d</option>
                    <option value={30}>30d</option>
                  </select>
                  <button
                    type="button"
                    onClick={handlePause}
                    disabled={!!loading}
                    className="text-[13px] font-semibold text-slate-500 border border-slate-200 rounded px-4 py-2 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                  >
                    {loading === 'pause' ? 'Pausing…' : 'Pause'}
                  </button>
                  <button
                    type="button"
                    onClick={handlePortal}
                    disabled={loading === 'portal'}
                    className="text-[13px] font-semibold text-slate-700 border border-slate-200 rounded px-4 py-2 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                  >
                    {loading === 'portal' ? 'Loading…' : 'Manage subscription'}
                  </button>
                </>
              )}
            </div>
          </div>
          {sub.isPaid && !paused && hasStripeCustomer && (
            <p className="mt-3 text-[12px] text-slate-400">
              <strong className="font-semibold text-slate-500">Pause</strong> stops billing temporarily - your data and pipeline stay intact.{' '}
              <strong className="font-semibold text-slate-500">Cancel</strong> (via Manage subscription) ends your subscription entirely.
            </p>
          )}
          {portalError && (
            <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded text-[13px] text-red-700">
              {portalError}
            </div>
          )}
          {actionError && (
            <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded text-[13px] text-red-700">
              {actionError}
            </div>
          )}
          {actionMessage && (
            <div className="mt-3 px-4 py-3 bg-green-50 border border-green-200 rounded text-[13px] text-green-700">
              {actionMessage}
            </div>
          )}
        </div>

        {/* Plans */}
        {!sub.isPaid && (
          <>
            <p className="text-[13px] text-slate-500 leading-relaxed mb-6">
              One hour with an executive coach runs $300 to $500. Starting Monday is $199 a month and runs every day.
            </p>

            <div className="flex items-center gap-3 mb-6">
              <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400">Choose a plan</p>
              <div className="ml-auto flex rounded border border-slate-200 overflow-hidden text-[12px] font-semibold">
                <button
                  type="button"
                  onClick={() => setInterval('monthly')}
                  className={`px-4 py-1.5 transition-colors ${interval === 'monthly' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setInterval('annual')}
                  className={`px-4 py-1.5 transition-colors ${interval === 'annual' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                  Annual
                </button>
              </div>
              {interval === 'annual' && (
                <span className="text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                  2 months free
                </span>
              )}
            </div>

            {/* Subscribable plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {(Object.entries(PLANS) as [keyof typeof PLANS, (typeof PLANS)[keyof typeof PLANS]][]).map(([key, plan]) => {
                const amount = interval === 'annual' ? plan.annualAmount : plan.amount
                const monthlyEquiv = interval === 'annual' ? Math.round(plan.annualAmount / 12) : null
                const isFeatured = key === 'active'
                return (
                  <div key={key} className={`bg-white border rounded p-6 ${isFeatured ? 'border-slate-900' : 'border-slate-200'}`}>
                    {isFeatured && (
                      <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-orange-500 mb-3">Most popular</p>
                    )}
                    <p className="text-[20px] font-bold text-slate-900">{plan.name}</p>
                    <p className="text-[28px] font-bold text-slate-900 mt-1">
                      ${interval === 'annual' ? (monthlyEquiv! / 100).toFixed(0) : (amount / 100).toFixed(0)}
                      <span className="text-[14px] font-normal text-slate-500">/mo</span>
                    </p>
                    {interval === 'annual' && monthlyEquiv && (
                      <p className="text-[12px] text-slate-400 mt-0.5">
                        billed as ${(amount / 100).toFixed(0)}/yr · <span className="text-green-600">Save ${((plan.amount * 12 - plan.annualAmount) / 100).toFixed(0)}</span>
                      </p>
                    )}
                    <p className="text-[13px] text-slate-500 mt-2 mb-4 leading-relaxed">{plan.description}</p>
                    <ul className="mb-5 flex flex-col gap-1.5">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-[13px] text-slate-600">
                          <span className="text-slate-400 shrink-0 mt-0.5">+</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => handleCheckout(key as 'passive' | 'active' | 'executive')}
                      disabled={loading === key}
                      className={`w-full py-2.5 rounded text-[13px] font-semibold border-0 cursor-pointer disabled:opacity-50 ${isFeatured ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
                    >
                      {loading === key ? 'Redirecting…' : `Subscribe to ${plan.name}`}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Waitlist plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.entries(WAITLIST_PLANS) as [string, typeof WAITLIST_PLANS[keyof typeof WAITLIST_PLANS]][]).map(([key, plan]) => (
                <div key={key} className="bg-white border border-slate-200 rounded p-6 opacity-80">
                  <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-3">Coming soon</p>
                  <p className="text-[20px] font-bold text-slate-900">{plan.name}</p>
                  <p className="text-[28px] font-bold text-slate-900 mt-1">
                    ${(plan.amount / 100).toFixed(0)}
                    <span className="text-[14px] font-normal text-slate-500">/mo</span>
                  </p>
                  <p className="text-[13px] text-slate-500 mt-2 mb-4 leading-relaxed">{plan.description}</p>
                  <ul className="mb-5 flex flex-col gap-1.5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-[13px] text-slate-600">
                        <span className="text-slate-400 shrink-0 mt-0.5">+</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => handleWaitlist(plan.name)}
                    className="w-full py-2.5 rounded text-[13px] font-semibold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="bg-white border border-slate-200 rounded p-6 mt-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400">Executive add-ons</p>
              <p className="text-[13px] text-slate-500 mt-1">Micro-products for role-specific outcomes. Purchased separately from plan tier.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MICRO_PRODUCT_DEFINITIONS.filter((item) => item.channel === 'executives').map((item) => {
              const highlighted = highlightedAddOn === item.slug
              return (
                <div key={item.slug} className={`rounded border p-4 ${highlighted ? 'border-orange-500 bg-orange-50/40' : 'border-slate-200 bg-slate-50'}`}>
                  <p className="text-[14px] font-semibold text-slate-900">{item.name}</p>
                  <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">{item.summary}</p>
                  <p className="text-[13px] font-semibold text-slate-900 mt-3">{formatMicroProductPrice(item.amountCents, item.defaultInterval)}</p>
                  <button
                    type="button"
                    onClick={() => handleMicroProductCheckout(item.slug)}
                    disabled={microLoading === item.slug}
                    className="mt-3 w-full py-2.5 rounded text-[13px] font-semibold border-0 cursor-pointer disabled:opacity-50 bg-slate-900 text-white hover:bg-slate-700"
                  >
                    {microLoading === item.slug ? 'Redirecting…' : 'Buy add-on'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}

