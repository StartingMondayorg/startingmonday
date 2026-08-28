import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SecurityClient } from './security-client'

export const metadata = { title: 'Security - Starting Monday' }

export default async function SecuritySettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              &larr; Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-8">
          <h1 className="text-[26px] font-bold text-foreground">Security</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Manage how you sign in.
          </p>
        </div>

        <SecurityClient accountEmail={user.email ?? 'your account'} />
      </main>
    </div>
  )
}
