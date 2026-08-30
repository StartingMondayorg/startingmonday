'use client'

import { ExecutiveDecisionCockpit } from '@/app/(dashboard)/dashboard/_components/ExecutiveDecisionCockpit'

/**
 * Decision cockpit sub-route under optionality.
 * Sprint ITS-3 / Ticket 18.
 */
export default function OptionalityDecisionCockpitPage() {
  return (
    <div className="min-h-screen bg-muted font-sans">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-4">
        <div className="mb-4">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-primary mb-1">
            Decision Cockpit
          </p>
          <h1 className="text-[22px] font-bold text-foreground leading-tight">
            Target and offer evaluation
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Score targets against what matters, set hard constraints, and capture pre/post interview reflections.
          </p>
        </div>
        <ExecutiveDecisionCockpit
          onSave={async (criteria, evaluations) => {
            try {
              const response = await fetch('/api/executive/decision-cockpit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ criteria, evaluations }),
              })
              if (!response.ok) {
                console.error('Failed to save decision cockpit:', response.statusText)
              } else {
                console.info('Decision cockpit saved successfully')
              }
            } catch (error) {
              console.error('Error saving decision cockpit:', error)
            }
          }}
        />
      </main>
    </div>
  )
}
