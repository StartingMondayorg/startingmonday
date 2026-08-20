import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY

if (key && process.env.NODE_ENV === 'production') {
  try {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com',
      capture_pageview: false,
      capture_pageleave: true,
    })
  } catch {
    // Analytics must never block application startup.
  }
}