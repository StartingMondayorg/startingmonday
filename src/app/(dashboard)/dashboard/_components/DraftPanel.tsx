'use client'
import { useState } from 'react'
import { Button, Card, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui'
export function DraftPanel({ draft }: { draft: { subject: string; body: string } }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    const text = `Subject: ${draft.subject}\n\n${draft.body}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Collapsible className="mt-2">
      <CollapsibleTrigger className="text-[12px] text-primary font-semibold cursor-pointer">
        Draft ready &#8595;
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="mt-2 border-primary/30 bg-primary/10 p-3">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">Subject</p>
          <p className="text-[13px] font-semibold text-foreground mb-3">{draft.subject}</p>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">Body</p>
          <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap mb-3">{draft.body}</p>
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={copy}
              className="text-[11px] font-semibold text-primary border-primary/30 bg-card hover:bg-primary/10 px-3 py-1"
            >
              {copied ? 'Copied!' : 'Copy to clipboard'}
            </Button>
            <a
              href="https://www.manager-tools.com/2016/09/job-search-tracking"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-muted-foreground underline"
            >
              Log this send
            </a>
          </div>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  )
}
