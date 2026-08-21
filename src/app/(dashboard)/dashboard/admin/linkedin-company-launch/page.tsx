import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'
import { Card } from '@/components/ui'
const TAGLINE = 'Be ready before the market knows.'

export default async function LinkedInCompanyLaunchPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="bg-primary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-primary-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin" className="text-[12px] font-semibold text-muted-foreground transition-colors">← Admin</Link>
            <Link href="/dashboard/admin/social" className="text-[12px] font-semibold text-muted-foreground transition-colors">Social</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-foreground leading-tight">LinkedIn Company Page Launch - Liz Runbook</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">Internal implementation guide for launching the Starting Monday company page with approved branding and content.</p>
        </div>

        <Card className="p-6 mb-6">
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Approved Brand Stack</p>
          <ul className="text-[13px] text-muted-foreground leading-7 list-disc pl-5">
            <li>Avatar: <span className="font-mono text-foreground">public/brand/starting-monday-logo-option-b.svg</span></li>
            <li>Banner: <span className="font-mono text-foreground">public/brand/linkedin-company-banner.svg</span></li>
            <li>Tagline: <span className="font-semibold text-foreground">{TAGLINE}</span></li>
            <li>Supporting descriptor: <span className="font-semibold text-foreground">Executive Search Operating System</span></li>
          </ul>
        </Card>

        <Card className="p-6 mb-6">
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Implementation Steps (Exact Order)</p>
          <ol className="text-[13px] text-muted-foreground leading-7 list-decimal pl-5">
            <li>Open LinkedIn company admin and go to Edit Page.</li>
            <li>Upload the avatar file: <span className="font-mono text-foreground">starting-monday-logo-option-b.svg</span>.</li>
            <li>Upload the banner file: <span className="font-mono text-foreground">linkedin-company-banner.svg</span>.</li>
            <li>Set headline to: <span className="font-semibold text-foreground">{TAGLINE}</span></li>
            <li>Set About section from the approved copy in <span className="font-mono text-foreground">docs/content/branding/company-page-and-logo-upgrade-pack.md</span>.</li>
            <li>Add missing company details: location and services.</li>
            <li>Publish weekdays using the approved queue from <span className="font-mono text-foreground">/dashboard/admin/social</span>.</li>
            <li>Post sequence for week 1: executives, search firms, executive coaches, outplacement firms, executives.</li>
            <li>Reply to meaningful comments same day and log outcomes in social notes.</li>
            <li>Track week 1 metrics: impressions, comments, saves, profile visits, new followers, qualified DMs.</li>
          </ol>
        </Card>

        <Card className="p-6 mb-6">
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Short Copy Blocks</p>
          <div className="space-y-4">
            <div>
              <p className="text-[12px] font-semibold text-foreground mb-1">Headline</p>
              <p className="text-[13px] text-muted-foreground bg-muted border border-border rounded px-3 py-2">Be ready before the market knows.</p>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-foreground mb-1">Backup headline</p>
              <p className="text-[13px] text-muted-foreground bg-muted border border-border rounded px-3 py-2">Run the search before it turns reactive.</p>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-foreground mb-1">Compact line</p>
              <p className="text-[13px] text-muted-foreground bg-muted border border-border rounded px-3 py-2">Early signal. Better outcomes.</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Reference Docs</p>
          <ul className="text-[13px] text-muted-foreground leading-7 list-disc pl-5">
            <li><span className="font-mono text-foreground">docs/content/branding/company-page-and-logo-upgrade-pack.md</span></li>
            <li><span className="font-mono text-foreground">docs/content/branding/linkedin-brand-rollout-checklist.md</span></li>
            <li><span className="font-mono text-foreground">docs/content/branding/icon-tagline-synthetic-council-review.md</span></li>
          </ul>
        </Card>
      </main>
    </div>
  )
}

