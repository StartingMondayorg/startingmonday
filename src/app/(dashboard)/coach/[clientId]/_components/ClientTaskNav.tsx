'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

const COACH_TASKS = [
  { href: 'interview', label: 'Interview', id: 'interview' },
  { href: 'companies', label: 'Companies', id: 'companies' },
  { href: 'meetings', label: 'Meetings', id: 'meetings' },
  { href: 'communications', label: 'Communications', id: 'communications' },
]

export function ClientTaskNav({ clientId }: { clientId: string }) {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {COACH_TASKS.map((task) => {
            const href = `/coach/${clientId}/${task.href}`
            const isActive = pathname.startsWith(href)
            return (
              <Button
                key={task.id}
                variant="ghost"
                render={<Link href={href} />}
                className={cn(
                  'h-auto flex-shrink-0 rounded-none border-b-2 px-4 py-3 text-[13px] font-medium whitespace-nowrap hover:bg-transparent',
                  isActive
                    ? 'border-primary/30 text-primary hover:text-primary'
                    : 'border-transparent text-muted-foreground hover:text-muted-foreground'
                )}
              >
                {task.label}
              </Button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
