import { NextResponse } from 'next/server'

// Retired: the worker (worker/jobs/briefing-job.js) is the active briefing sender.
// This endpoint is no longer called. Returning 410 Gone so any stale cron
// callers get a clear signal rather than a silent 404.
export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint has been retired. Briefings are sent by the worker service.' },
    { status: 410 }
  )
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
