import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientTaskNav } from './_components/ClientTaskNav'

export default async function CoachClientLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ clientId: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { clientId } = await params

  // TODO: Fetch client details from Supabase
  // Verify coach has access to this client
  const client = {
    id: clientId,
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    status: 'In Prep',
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/coach/clients"
              className="text-[12px] text-muted-foreground transition-colors"
            >
              ← Back to clients
            </Link>
          </div>
          <h1 className="text-[24px] font-bold text-foreground mb-1">{client.name}</h1>
          <p className="text-[13px] text-muted-foreground">{client.email}</p>
        </div>
      </div>

      {/* Task navigation */}
      <ClientTaskNav clientId={clientId} />

      {/* Page content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </div>
    </div>
  )
}
