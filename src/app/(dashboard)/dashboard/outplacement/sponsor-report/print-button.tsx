'use client'

import { Button } from '@/components/ui'
export function PrintButton() {
  return (
    <Button
      variant="ghost"
      onClick={() => window.print()}
      className="h-auto p-0 text-[12px] text-muted-foreground hover:text-primary-foreground hover:bg-transparent"
    >
      Print / Export PDF
    </Button>
  )
}
