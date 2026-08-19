import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'
import { markPosthogClientReady } from '@/lib/posthog-client-readiness'

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY

if (key) {
  try {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com',
      capture_pageview: false,
      capture_pageleave: true,
      loaded: markPosthogClientReady,
    })
  } catch {
    // Analytics must never block application startup.
  }
}