import type { Metadata } from 'next'
import { TrackLink } from '@/components/TrackLink'
import { EVENT_NAMES } from '@/lib/channel-metrics-events'

export const metadata: Metadata = {
  title: 'Executives Optionality Mode | Starting Monday',
  description: 'Optionality mode for executives not actively searching yet but building signal awareness and strategic relationship momentum.',
  alternates: {
    canonical: 'https://startingmonday.app/executives/passive',
  },
}

export default function ExecutivesPassiveModePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 sm:px-6 py-14 sm:py-20">
      <div className="max-w-3xl mx-auto">
        <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-400 mb-4">Executive mode: optionality</p>
        <h1 className="text-[34px] sm:text-[42px] font-bold leading-[1.1] tracking-tight mb-4">Build optionality before you need it.</h1>
        <p className="text-[16px] text-slate-300 leading-relaxed mb-7">
          This mode is for executives staying in seat while monitoring transition windows, keeping warm relationships active, and preserving strategic leverage.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded border border-slate-800 bg-slate-900 p-4">
            <p className="text-[12px] font-semibold text-white mb-2">Monitoring cadence</p>
            <p className="text-[13px] text-slate-300">Weekly signal digest with low-noise alerts for transition windows.</p>
          </div>
          <div className="rounded border border-slate-800 bg-slate-900 p-4">
            <p className="text-[12px] font-semibold text-white mb-2">Primary objective</p>
            <p className="text-[13px] text-slate-300">Increase strategic readiness without launching a visible active search.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <TrackLink
            href="/executives/personas"
            event={EVENT_NAMES.personaRouteSelected}
            logToUserEvents
            properties={{ channel: 'executives', persona: 'passive_mode', source_route: '/executives/passive', target_route: '/executives/personas' }}
            className="inline-block bg-orange-500 text-slate-900 text-[14px] font-semibold px-5 py-3 rounded hover:bg-orange-600 transition-colors"
          >
            Choose executive persona
          </TrackLink>
          <TrackLink
            href="/signup"
            event={EVENT_NAMES.channelEntryClicked}
            logToUserEvents
            properties={{ channel: 'executives', cta_label: 'Start optionality mode', source_page: '/executives/passive' }}
            className="inline-block border border-slate-600 text-slate-100 text-[14px] font-semibold px-5 py-3 rounded hover:border-slate-300 transition-colors"
          >
            Start optionality mode
          </TrackLink>
        </div>
      </div>
    
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
  )
}
