'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

const PREP_TASKS = [
  { href: '/prep/interview', label: 'Interview', id: 'interview' },
  { href: '/prep/companies', label: 'Companies', id: 'companies' },
  { href: '/prep/meetings', label: 'Meetings', id: 'meetings' },
  { href: '/prep/communications', label: 'Communications', id: 'communications' },
]

export default function PrepLayout({ 
  children,
}: { 
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Task navigation */}
      <nav className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {PREP_TASKS.map((task) => {
              const isActive = pathname.startsWith(task.href)
              return (
                <Button
                  key={task.id}
                  variant="ghost"
                  render={<Link href={task.href} />}
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

      {/* Page content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </div>
    </div>
  )
}
