import { getNextScanDate, CSUITE_PATTERNS, type ScanResult } from './company-detail-constants'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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
      <div className="px-6 py-10 text-center text-[14px] text-slate-400">
        {isScanning && careerPageUrl ? (
          <div className="flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse inline-block" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse inline-block [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse inline-block [animation-delay:300ms]" />
            <span className="ml-1 text-[13px] text-slate-400">Scanning career page now...</span>
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
        <p className="text-[13px] font-semibold text-slate-300 mb-1">Career page blocks automated scanning</p>
        <p className="text-[13px] text-slate-400 leading-relaxed">
          This site actively blocks bots (common with government and Cloudflare-protected sites).{' '}
          <a href="#documents" className="text-slate-300 underline hover:text-white">
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
        <p className="text-[13px] font-semibold text-slate-300 mb-1">Career page blocks automated scanning</p>
        <p className="text-[13px] text-slate-400 leading-relaxed">
          This site actively blocks bots (common with government and Cloudflare-protected sites).{' '}
          <a href="#documents" className="text-slate-300 underline hover:text-white">
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
        <p className="text-[13px] font-semibold text-slate-300 mb-1">Scan encountered an error</p>
        <p className="text-[13px] text-slate-400">{latestScan.error_message ?? 'Unknown error'} - this will be retried on the next scheduled run.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="px-6 py-5 border-b border-slate-50">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          {latestScan.ai_score >= 60 ? (
            <Badge variant="success" className="gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {latestScan.ai_score} match score
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
              No matches
            </Badge>
          )}
          <span className="text-[11px] text-slate-300">60+ = strong match</span>
        </div>
        {latestScan.ai_summary && <p className="text-[13px] text-slate-400">{latestScan.ai_summary}</p>}
      </div>

      {(latestScan.raw_hits ?? []).filter((h) => h.is_match).length > 0 && (
        <div className="divide-y divide-white/10">
          {(latestScan.raw_hits ?? []).filter((h) => h.is_match).map((hit, i) => (
            <div key={i} className="px-6 py-4">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[14px] font-semibold text-white">{hit.title}</span>
                <span className="text-[11px] font-bold text-slate-400">{hit.score}</span>
                {hit.is_new && <Badge variant="warning">New</Badge>}
                {isVpUser && isStepUpRole(hit.title) && (
                  <Badge className="bg-orange-500/10 text-orange-600">Step-Up Opportunity</Badge>
                )}
              </div>
              {hit.summary && <p className="text-[12px] text-slate-400">{hit.summary}</p>}
            </div>
          ))}
        </div>
      )}

      {scanHistory.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-50 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mr-1">History</span>
          <TooltipProvider>
            {scanHistory.map((s) => {
              const dateStr = new Date(s.scanned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              const scoreStr = s.status === 'error' ? 'Error' : s.ai_score >= 60 ? `Score: ${s.ai_score}` : 'No match'
              return (
                <Tooltip key={s.id}>
                  <TooltipTrigger
                    className={`w-2.5 h-2.5 rounded-full inline-block cursor-help ${s.ai_score >= 60 ? 'bg-emerald-400' : s.status === 'error' ? 'bg-red-300' : 'bg-white/10'}`}
                  />
                  <TooltipContent>{`${dateStr} - ${scoreStr}`}</TooltipContent>
                </Tooltip>
              )
            })}
          </TooltipProvider>
          <span className="text-[10px] text-slate-300 ml-1">hover for date and score</span>
        </div>
      )}
    </div>
  )
}
