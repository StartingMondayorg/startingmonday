'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui'

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // The server cannot know the resolved theme, so hold the icon back until mount
  // rather than render one and swap it on hydration.
  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {mounted ? (isDark ? <Sun aria-hidden /> : <Moon aria-hidden />) : <span className="size-4" />}
    </Button>
  )
}
