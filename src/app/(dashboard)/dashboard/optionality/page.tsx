import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { LIFECYCLE_TEMPLATES, LIFECYCLE_STATE_DESCRIPTIONS } from '@/lib/executive-lifecycle'
import { Alert, AlertDescription, AlertTitle, Badge, Button, Card } from '@/components/ui'
export const metadata: Metadata = {
  title: 'Optionality Mode | Starting Monday',
  description: 'Quietly monitor the market, warm key relationships, and stay ready - without signaling departure.',
}

/**
 * Optionality Mode - Sprint ITS-3 Ticket 16
 *
 * AC:
 * - Distinct from active search state
 * - Confidentiality-safe workflow framing
 * - Persona-specific: in-role quiet variant
 * - Subtle external positioning guidance
 * - Accomplishment record and relationship-warmth loop accessible from here
 */
export default async function OptionalityModePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, search_status, positioning_summary')
    .eq('user_id', user.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const template = LIFECYCLE_TEMPLATES.find(
    (t) => t.state === 'optionality' && t.persona === 'in_role_quiet',
  )!

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="dark bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <Link href="/dashboard" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        {/* Mode header */}
        <Card className="px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-primary mb-2">
                Optionality Mode - In-Role (Quiet)
              </p>
              <h1 className="text-[26px] font-bold text-foreground leading-tight">
                Good to see you, {firstName}.
              </h1>
              <p className="text-[14px] text-muted-foreground mt-2 leading-relaxed max-w-xl">
                {LIFECYCLE_STATE_DESCRIPTIONS.optionality}
              </p>
            </div>
            <Badge variant="warning" className="flex-shrink-0 text-[11px] px-3 py-1.5 h-auto">
              Quiet mode
            </Badge>
          </div>
        </Card>

        {/* Confidentiality notice */}
        <Alert variant="warning">
          <AlertTitle>Confidentiality guidance</AlertTitle>
          <AlertDescription>{template.confidentialityNotes}</AlertDescription>
        </Alert>

        {/* Subtle external positioning guidance */}
        <Alert variant="info">
          <AlertTitle>External positioning - signal-level guidance</AlertTitle>
          <AlertDescription>{template.positioningGuidance}</AlertDescription>
        </Alert>

        {/* Weekly focus */}
        <Card className="px-5 py-5">
          <h2 className="text-[13px] font-bold text-muted-foreground mb-3">This week&apos;s focus</h2>
          <ul className="space-y-2">
            {template.weeklyFocus.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[13px] text-muted-foreground">
                <span className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">→</span>
                {item}
              </li>
            ))}
          </ul>
        </Card>

        {/* Session opening prompts */}
        <Card className="bg-muted px-5 py-5">
          <h2 className="text-[13px] font-bold text-muted-foreground mb-3">Coach session opening prompts</h2>
          <ul className="space-y-2">
            {template.sessionOpeningPrompts.map((prompt) => (
              <li key={prompt} className="flex items-start gap-3 text-[13px] text-muted-foreground italic">
                <span className="text-muted-foreground mt-0.5 not-italic">?</span>
                {prompt}
              </li>
            ))}
          </ul>
        </Card>

        {/* Navigation to related tools */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: '/dashboard/optionality/branding', label: 'Branding profile', desc: 'Maintain your narrative thesis and audience variants' },
            { href: '/dashboard/optionality/decision-cockpit', label: 'Decision cockpit', desc: 'Score targets against what matters to you' },
            { href: '/dashboard/post-landing', label: 'Post-landing mode', desc: '30/60/90 day onboarding plan' },
          ].map(({ href, label, desc }) => (
            <Link key={href} href={href} className="group">
              <Card className="px-4 py-4 hover:border-primary/30 transition-colors">
                <p className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">{label}</p>
                <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{desc}</p>
              </Card>
            </Link>
          ))}
        </div>

        {/* Switch to active search */}
        <Card className="px-5 py-4 flex-row items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold text-foreground">Ready to go active?</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">Switch to Active when urgency increases.</p>
          </div>
          <Button variant="outline" className="flex-shrink-0" render={<Link href="/dashboard" />}>
            Active dashboard →
          </Button>
        </Card>
      </main>
    </div>
  )
}
