'use client'
import Link from 'next/link'
import { Alert, AlertDescription, Button } from '@/components/ui'
export function DemoBanner() {
  return (
    <Alert variant="warning" className="rounded-none border-x-0 border-t-0 flex-row items-center justify-between gap-3 px-4 sm:px-6 py-2.5">
      <AlertDescription className="text-[12px] leading-relaxed text-current">
        <span className="font-semibold">Demo account</span> - exploring Sarah Chen&rsquo;s pipeline: VP Engineering targeting CTO roles in health tech.
        Briefs, briefings, and strategy are pre-generated.
      </AlertDescription>
      <Button size="sm" className="shrink-0" render={<Link href="/signup" />}>
        Start free &rarr;
      </Button>
    </Alert>
  )
}
