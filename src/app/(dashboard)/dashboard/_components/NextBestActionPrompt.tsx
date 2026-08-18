import { TrackLink } from '@/components/TrackLink'

export function NextBestActionPrompt({
  action,
  href,
  description,
  source,
}: {
  action: string
  href: string
  description?: string
  source: 'stall_nudge' | 'dashboard_default'
}) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-5 flex items-center gap-4 shadow-sm">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-amber-900 mb-1">Next best action</p>
        <p className="text-[13px] text-amber-800 leading-relaxed mb-2">{description}</p>
        <TrackLink
          href={href}
          event="next_best_action_clicked"
          properties={{ source, action }}
          className="inline-block text-[12px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded hover:bg-amber-200 transition-colors"
        >
          {action} →
        </TrackLink>
      </div>
    </div>
  )
}
