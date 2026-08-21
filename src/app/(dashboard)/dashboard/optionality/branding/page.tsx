'use client'

import { ExecutiveBrandingProfile } from '@/app/(dashboard)/dashboard/_components/ExecutiveBrandingProfile'

/**
 * Branding profile sub-route under optionality.
 * Rendered client-side so the form is interactive.
 * Sprint ITS-3 / Ticket 22.
 */
export default function OptionalityBrandingPage() {
  return (
    <div className="min-h-screen bg-muted font-sans">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-4">
        <div className="mb-6">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-primary mb-1">
            Executive Branding Profile
          </p>
          <h1 className="text-[22px] font-bold text-foreground leading-tight">
            Your narrative thesis and audience variants
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Keep this updated whenever your role scope or story changes.
          </p>
        </div>
        <ExecutiveBrandingProfile
          lifecycleState="optionality"
          personaVariant="in_role_quiet"
          onSave={async (data) => {
            try {
              const response = await fetch('/api/executive/branding-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              })
              if (!response.ok) {
                console.error('Failed to save branding profile:', response.statusText)
              } else {
                console.info('Branding profile saved successfully')
              }
            } catch (error) {
              console.error('Error saving branding profile:', error)
            }
          }}
        />
      </main>
    </div>
  )
}
