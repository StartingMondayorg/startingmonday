import { describe, expect, it } from 'vitest'
import { classifyGraphStalls } from '@/lib/action-scores'

describe('src/app/api/coach/client/[clientId]/scorecards/route.ts contract helpers', () => {
  it('supports a no-stall snapshot when graph movement exists', () => {
    expect(classifyGraphStalls({
      activePipelineCount: 3,
      overdueActions: 0,
      lastSignalDays: 1,
      lastBriefDays: 1,
      signalsSinceBaseline: 2,
      pipelineChangesSinceBaseline: 1,
      briefReviewsSinceBaseline: 1,
    })).toEqual([])
  })
})
