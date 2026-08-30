'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ComponentProps } from 'react'

/*
  Owns the single light/dark flag for the whole app. Every component styles itself
  with semantic tokens (see globals.css), so flipping the class on <html> here is
  all that is needed to re-theme the app — no component reads the theme directly.
*/
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
