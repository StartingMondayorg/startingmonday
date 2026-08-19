'use client'

import { usePostHog } from 'posthog-js/react'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'

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
        className="w-full rounded-md border border-white/12 bg-white/5 px-4 py-2 text-[12px] text-slate-100/90 sm:w-auto"
        onOpenChange={handleToggle}
      >
        <CollapsibleTrigger className="group flex w-full min-h-[44px] cursor-pointer items-center justify-between gap-2 font-semibold text-white/90">
          Why this matters now
          <span className="text-slate-300 transition-transform group-data-panel-open:rotate-180">▾</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p className="mt-2 max-w-xl leading-relaxed text-slate-200/90">{whyNow}</p>
        </CollapsibleContent>
      </Collapsible>

      <Button
        variant="outline"
        className="min-h-[44px] border-white/12 text-slate-100 hover:border-white/30 hover:text-white"
        onClick={handleEmailClick}
        render={<a href={mailtoHref} />}
      >
        Email me this plan
      </Button>
    </>
  )
}
