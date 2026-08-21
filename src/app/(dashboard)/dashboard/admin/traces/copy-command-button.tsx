'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
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
      className="text-[11px] font-semibold border-success/30 bg-success/15 text-success"
    >
      {copied ? 'Copied' : 'Copy command'}
    </Button>
  )
}