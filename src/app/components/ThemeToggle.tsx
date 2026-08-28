'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui'

/*
  Icon visibility is driven by the `dark` class in CSS rather than by React state,
  so there is no mount gate and no server/client mismatch to work around.
*/
export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label="Toggle between light and dark theme"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <Moon aria-hidden className="block dark:hidden" />
      <Sun aria-hidden className="hidden dark:block" />
    </Button>
  )
}
