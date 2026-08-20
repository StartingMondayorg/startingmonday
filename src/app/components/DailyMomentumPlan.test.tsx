import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DailyMomentumPlan } from './DailyMomentumPlan'

describe('src/components/DailyMomentumPlan.tsx', () => {
  it('renders the one-screen daily loop with three actions and recovery guidance', () => {
    const html = renderToStaticMarkup(
      <DailyMomentumPlan
        actions={[
          {
            id: 'relationship-action',
            track: 'relationship',
            title: 'Work one relationship',
            body: 'Use a fresh signal to reopen a warm conversation.',
            effortMinutes: 15,
            href: '/dashboard/contacts',
            cta: 'Open contacts',
          },
          {
            id: 'readiness-action',
            track: 'readiness',
            title: 'Run one prep pass',
            body: 'Tighten the story before another live conversation.',
            effortMinutes: 20,
            href: '/dashboard/strategy',
            cta: 'Open strategy',
          },
          {
            id: 'focus-action',
            track: 'focus',
            title: 'Pick the next visible move',
            body: 'Convert today into one concrete next step.',
            effortMinutes: 10,
            href: '/dashboard/briefing',
            cta: 'Open briefing',
          },
        ]}
        dateKey="2026-05-25"
        status="medium"
      />,
    )

    expect(html).toContain('Today&#x27;s three actions')
    expect(html).toContain('Work one relationship')
    expect(html).toContain('Run one prep pass')
    expect(html).toContain('Pick the next visible move')
    expect(html).toContain('Recovery rule')
  })
})