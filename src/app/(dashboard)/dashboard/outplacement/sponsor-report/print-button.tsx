'use client'

import { Button } from '@/components/ui/button'

export function PrintButton() {
  return (
    <Button
      variant="ghost"
      onClick={() => window.print()}
      className="h-auto p-0 text-[12px] text-slate-300 hover:text-white hover:bg-transparent"
    >
      Print / Export PDF
    </Button>
  )
}
