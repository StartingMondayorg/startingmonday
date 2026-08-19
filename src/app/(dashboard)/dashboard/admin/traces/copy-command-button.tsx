'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function CopyCommandButton({ command }: { command: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={handleCopy}
      variant="outline"
      size="sm"
      className="text-[11px] font-semibold border-emerald-300/30 bg-emerald-500/15 text-emerald-100 hover:border-emerald-200 hover:bg-emerald-500/15"
    >
      {copied ? 'Copied' : 'Copy command'}
    </Button>
  )
}