import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui'
export const metadata = { title: 'Join Starting Monday' }

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('user_profiles')
    .select('full_name')
    .eq('invite_code', code)
    .single()

  const referrerName = profile?.full_name?.split(' ')[0] ?? null

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">

      <header className="px-6 h-14 flex items-center">
        <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground hover:text-foreground transition-colors">
          <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-lg w-full">

          {referrerName ? (
            <p className="text-[14px] text-muted-foreground mb-4">
              {referrerName} is using Starting Monday for their executive search
              and thought you should know about it.
            </p>
          ) : (
            <p className="text-[14px] text-muted-foreground mb-4">
              Someone on Starting Monday thought you should know about this.
            </p>
          )}

          <h1 className="text-[38px] sm:text-[48px] font-bold text-foreground leading-[1.1] tracking-tight mb-5">
            Your next role<br />isn&rsquo;t on a<br />job board.
          </h1>

          <p className="text-[15px] text-foreground leading-relaxed mb-8 max-w-sm">
            Starting Monday watches your target companies, surfaces openings before
            they go public, and has your prep brief ready before the first call.
          </p>

          <p className="text-[12px] text-muted-foreground mb-3 max-w-sm">
            Trust and confidentiality: your account activity and search workflow stay private to you.
          </p>
          <p className="text-[12px] text-muted-foreground mb-4 max-w-sm">
            CTA: get started now by creating your free account from this invite.
          </p>

          <Button
            size="lg"
            className="!bg-primary !text-primary-foreground text-[14px] font-bold px-7 py-3.5 h-auto hover:!bg-primary/90"
            render={<Link href={`/signup?ref=${code}`} />}
          >
            Get started now &rarr;
          </Button>
          <p className="text-[12px] text-muted-foreground mt-3">Free for 30 days. No credit card.</p>

          <div className="mt-10 pt-8 border-t border-border">
            <p className="text-[13px] text-muted-foreground mb-4">Want to see it first?</p>
            <Link
              href="/demo"
              className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Explore a live demo &rarr;
            </Link>
          </div>

        </div>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

