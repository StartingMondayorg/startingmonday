'use client'

import { usePostHog } from 'posthog-js/react'
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui'
type BriefingPulseSupportProps = {
  state: 'building' | 'steady' | 'watch'
  whyNow: string
  mailtoHref: string
}

type PulseSupportAction = 'why_this_matters_opened' | 'email_plan_clicked'

const TRACK_ENDPOINT = '/api/briefing/pulse-events'

export function BriefingPulseSupport({ state, whyNow, mailtoHref }: BriefingPulseSupportProps) {
  const posthog = usePostHog()

  function track(action: PulseSupportAction, target: 'inline_explainer' | 'mailto') {
    const properties = {
      section: 'weekly_pulse_support',
      action,
      target,
      pulse_state: state,
    }

    try {
      posthog?.capture('briefing_action_clicked', properties)
    } catch {
      // Analytics must never block interaction.
    }

    try {
      void fetch(TRACK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(properties),
        keepalive: true,
      })
    } catch {
      // Analytics must never block interaction.
    }
  }

  function handleToggle(open: boolean) {
    if (open) {
      track('why_this_matters_opened', 'inline_explainer')
    }
  }

  function handleEmailClick() {
    track('email_plan_clicked', 'mailto')
  }

  return (
    <>
      <Collapsible
        className="w-full rounded-md border border-border bg-muted/40 px-4 py-2 text-[12px] text-foreground/90 sm:w-auto"
        onOpenChange={handleToggle}
      >
        <CollapsibleTrigger className="group flex w-full min-h-[44px] cursor-pointer items-center justify-between gap-2 font-semibold text-foreground/90">
          Why this matters now
          <span className="text-muted-foreground transition-transform group-data-panel-open:rotate-180">▾</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p className="mt-2 max-w-xl leading-relaxed text-foreground/90">{whyNow}</p>
        </CollapsibleContent>
      </Collapsible>

      <Button
        variant="outline"
        className="min-h-[44px] border-border text-muted-foreground hover:text-foreground"
        onClick={handleEmailClick}
        render={<a href={mailtoHref} />}
      >
        Email me this plan
      </Button>
    </>
  )
}
