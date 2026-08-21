import { getNextScanDate, CSUITE_PATTERNS, type ScanResult } from './company-detail-constants'
import { Badge, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui'
type Props = {
  latestScan: ScanResult | null
  isScanning: boolean
  careerPageUrl: string | null
  isVpUser: boolean
  scanHistory: ScanResult[]
}

function isStepUpRole(title: string): boolean {
  const lower = title.toLowerCase()
  return CSUITE_PATTERNS.some((p) => lower.includes(p))
}

export function JobScanPanel(props: Props) {
  const { latestScan, isScanning, careerPageUrl, isVpUser, scanHistory } = props

  if (!latestScan) {
    return (
      <div className="px-6 py-10 text-center text-[14px] text-muted-foreground">
        {isScanning && careerPageUrl ? (
          <div className="flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse inline-block" />
            <span className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse inline-block [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse inline-block [animation-delay:300ms]" />
            <span className="ml-1 text-[13px] text-muted-foreground">Scanning career page now...</span>
          </div>
        ) : careerPageUrl ? (
          <>Results will appear after the next scheduled scan - <span className="font-medium">{getNextScanDate()}</span>.</>
        ) : (
          'Add a career page URL above to enable scanning.'
        )}
      </div>
    )
  }

  if (latestScan.status === 'blocked') {
    return (
      <div className="px-6 py-6">
        <p className="text-[13px] font-semibold text-muted-foreground mb-1">Career page blocks automated scanning</p>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          This site actively blocks bots (common with government and Cloudflare-protected sites).{' '}
          <a href="#documents" className="text-muted-foreground underline hover:text-foreground">
            Paste the job listing in the Documents section
          </a>{' '}
          below using the <strong>Job Description</strong> type - it will be used in your interview prep brief.
        </p>
      </div>
    )
  }

  if (latestScan.status === 'error' && /40[13]|block|access.denied/i.test(latestScan.error_message ?? '')) {
    return (
      <div className="px-6 py-6">
        <p className="text-[13px] font-semibold text-muted-foreground mb-1">Career page blocks automated scanning</p>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          This site actively blocks bots (common with government and Cloudflare-protected sites).{' '}
          <a href="#documents" className="text-muted-foreground underline hover:text-foreground">
            Paste the job listing in the Documents section
          </a>{' '}
          below using the <strong>Job Description</strong> type - it will be used in your interview prep brief.
        </p>
      </div>
    )
  }

  if (latestScan.status === 'error') {
    return (
      <div className="px-6 py-6">
        <p className="text-[13px] font-semibold text-muted-foreground mb-1">Scan encountered an error</p>
        <p className="text-[13px] text-muted-foreground">{latestScan.error_message ?? 'Unknown error'} - this will be retried on the next scheduled run.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          {latestScan.ai_score >= 60 ? (
            <Badge variant="success" className="gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
              {latestScan.ai_score} match score
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-muted inline-block" />
              No matches
            </Badge>
          )}
          <span className="text-[11px] text-muted-foreground">60+ = strong match</span>
        </div>
        {latestScan.ai_summary && <p className="text-[13px] text-muted-foreground">{latestScan.ai_summary}</p>}
      </div>

      {(latestScan.raw_hits ?? []).filter((h) => h.is_match).length > 0 && (
        <div className="divide-y divide-border">
          {(latestScan.raw_hits ?? []).filter((h) => h.is_match).map((hit, i) => (
            <div key={i} className="px-6 py-4">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[14px] font-semibold text-foreground">{hit.title}</span>
                <span className="text-[11px] font-bold text-muted-foreground">{hit.score}</span>
                {hit.is_new && <Badge variant="warning">New</Badge>}
                {isVpUser && isStepUpRole(hit.title) && (
                  <Badge className="bg-primary/10 text-primary">Step-Up Opportunity</Badge>
                )}
              </div>
              {hit.summary && <p className="text-[12px] text-muted-foreground">{hit.summary}</p>}
            </div>
          ))}
        </div>
      )}

      {scanHistory.length > 0 && (
        <div className="px-6 py-4 border-t border-border flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mr-1">History</span>
          <TooltipProvider>
            {scanHistory.map((s) => {
              const dateStr = new Date(s.scanned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              const scoreStr = s.status === 'error' ? 'Error' : s.ai_score >= 60 ? `Score: ${s.ai_score}` : 'No match'
              return (
                <Tooltip key={s.id}>
                  <TooltipTrigger
                    className={`w-2.5 h-2.5 rounded-full inline-block cursor-help ${s.ai_score >= 60 ? 'bg-success' : s.status === 'error' ? 'bg-destructive' : 'bg-muted/60'}`}
                  />
                  <TooltipContent>{`${dateStr} - ${scoreStr}`}</TooltipContent>
                </Tooltip>
              )
            })}
          </TooltipProvider>
          <span className="text-[10px] text-muted-foreground ml-1">hover for date and score</span>
        </div>
      )}
    </div>
  )
}
