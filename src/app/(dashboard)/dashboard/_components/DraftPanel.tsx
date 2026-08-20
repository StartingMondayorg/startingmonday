'use client'
import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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
      <CollapsibleTrigger className="text-[12px] text-orange-600 font-semibold cursor-pointer hover:text-orange-800">
        Draft ready &#8595;
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="mt-2 border-orange-100 bg-orange-50 p-3">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Subject</p>
          <p className="text-[13px] font-semibold text-slate-800 mb-3">{draft.subject}</p>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Body</p>
          <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap mb-3">{draft.body}</p>
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={copy}
              className="text-[11px] font-semibold text-orange-700 border-orange-200 bg-white hover:bg-orange-50 px-3 py-1"
            >
              {copied ? 'Copied!' : 'Copy to clipboard'}
            </Button>
            <a
              href="https://www.manager-tools.com/2016/09/job-search-tracking"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-slate-400 hover:text-slate-600 underline"
            >
              Log this send
            </a>
          </div>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  )
}
