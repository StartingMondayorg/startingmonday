import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, Badge, Card, Progress } from '@/components/ui'
export const metadata = {
  title: 'My Clients - Starting Monday',
  description: 'View and manage your coaching clients.',
}

export default async function CoachClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // TODO: Query coach_clients relationship to get list of assigned clients
  // This is a placeholder - actual implementation will fetch from Supabase
  const clients = [
    {
      id: '1',
      name: 'Sarah Chen',
      status: 'In Prep',
      completionPercent: 65,
      lastActivity: '2 hours ago',
      avatar: 'SC',
    },
    {
      id: '2',
      name: 'Michael Torres',
      status: 'Interviewing',
      completionPercent: 100,
      lastActivity: '1 day ago',
      avatar: 'MT',
    },
    {
      id: '3',
      name: 'Jessica Park',
      status: 'New',
      completionPercent: 0,
      lastActivity: 'Just started',
      avatar: 'JP',
    },
  ]

  const getStatusVariant = (status: string): 'info' | 'warning' | 'secondary' => {
    switch (status) {
      case 'In Prep':
        return 'info'
      case 'Interviewing':
        return 'warning'
      case 'New':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-foreground sm:text-[40px]">
            Your Clients
          </h1>
          <p className="text-[14px] leading-relaxed text-muted-foreground mt-2">
            {clients.length} active client{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Clients grid */}
      {clients.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Link key={client.id} href={`/coach/${client.id}`} className="group block">
              <Card variant="glass" className="p-6 transition-all group-hover:border-primary/40 group-hover:bg-card/60">
                {/* Avatar & Name */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar size="lg" className="bg-primary/10 text-[14px] font-semibold text-primary">
                      <AvatarFallback className="bg-primary/10 text-primary">{client.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-[14px] font-semibold text-foreground group-hover:text-primary transition-colors">
                        {client.name}
                      </p>
                      <p className="text-[12px] text-muted-foreground">{client.lastActivity}</p>
                    </div>
                  </div>
                </div>

                {/* Status badge */}
                <Badge variant={getStatusVariant(client.status)} className="mb-4">
                  {client.status}
                </Badge>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] text-muted-foreground">Prep completion</p>
                    <p className="text-[12px] font-semibold text-muted-foreground">{client.completionPercent}%</p>
                  </div>
                  <Progress
                    value={client.completionPercent}
                    className="gap-0 [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-background/50"
                  />
                </div>

                {/* CTA */}
                <p className="text-[12px] text-primary font-semibold mt-4 transition-colors">
                  View progress →
                </p>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card variant="glass" className="p-12 text-center">
          <p className="text-[14px] text-muted-foreground">
            You don't have any active clients yet.
          </p>
        </Card>
      )}

      {/* Info card */}
      <Card variant="glass" className="border-border/50 p-6 sm:p-8">
        <p className="text-[13px] font-semibold text-muted-foreground mb-3">How to add clients</p>
        <p className="text-[14px] leading-relaxed text-foreground mb-4">
          Clients are added through the partnership setup. Once a client accepts your coaching arrangement, they'll appear here automatically.
        </p>
        <Link
          href="/help"
          className="text-[13px] font-semibold text-primary transition-colors"
        >
          Learn more about client management →
        </Link>
      </Card>
    </div>
  )
}
