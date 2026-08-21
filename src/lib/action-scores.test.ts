import { describe, expect, it } from 'vitest'
import { ACTION_SCORES, classifyGraphStalls, compositeScore, GROUP_COLORS, GROUP_LABELS, STALL_THRESHOLDS, type ScoreGroup } from '@/lib/action-scores'

describe('src/lib/action-scores.ts', () => {
  it('keeps composite scores positive for high-value actions', () => {
    expect(compositeScore({ label: 'Prep', group: 'intelligence', emotion: 9, cognitive_load: 2, retention: 10 })).toBe(17)
  })

  it('classifies stalled graph lanes from inactivity plus overdue actions', () => {
    const stalls = classifyGraphStalls({
      activePipelineCount: 4,
      overdueActions: STALL_THRESHOLDS.overdueActionsStalled,
      lastSignalDays: STALL_THRESHOLDS.signalsStalledDays,
      lastBriefDays: STALL_THRESHOLDS.briefStalledDays,
      signalsSinceBaseline: 0,
      pipelineChangesSinceBaseline: 0,
      briefReviewsSinceBaseline: 0,
    })

    expect(stalls).toEqual([
      { lane: 'signals', state: 'stalled', reason: 'No fresh signals for 14 days.' },
      { lane: 'preparation', state: 'stalled', reason: 'No brief review progress for 14 days.' },
      { lane: 'pipeline', state: 'stalled', reason: '3 overdue actions with no pipeline movement since the last session.' },
    ])
  })

  it('returns a watch state before full stall thresholds are hit', () => {
    const stalls = classifyGraphStalls({
      activePipelineCount: 2,
      overdueActions: 1,
      lastSignalDays: STALL_THRESHOLDS.signalsWatchDays,
      lastBriefDays: STALL_THRESHOLDS.briefWatchDays,
      signalsSinceBaseline: 0,
      pipelineChangesSinceBaseline: 0,
      briefReviewsSinceBaseline: 0,
    })

    expect(stalls.map((stall) => stall.state)).toEqual(['watch', 'watch', 'watch'])
  })
})

describe('src/lib/action-scores.ts token and threshold coverage', () => {
  it('exposes a chart token for every score group, with no duplicates', () => {
    const groups = Object.keys(GROUP_LABELS) as ScoreGroup[]
    const colors = groups.map(g => GROUP_COLORS[g])

    for (const color of colors) expect(color).toMatch(/^var\(--chart-[1-9]\)$/)
    // Distinct series colours; a repeat would make two groups indistinguishable.
    expect(new Set(colors).size).toBe(groups.length)
  })

  it('labels every score group referenced by ACTION_SCORES', () => {
    for (const score of Object.values(ACTION_SCORES)) {
      expect(GROUP_LABELS[score.group]).toBeTruthy()
      expect(GROUP_COLORS[score.group]).toBeTruthy()
    }
  })

  it('ranks composite score by emotion and retention over cognitive load', () => {
    const easy = compositeScore({ label: 'a', group: 'signals', emotion: 8, cognitive_load: 1, retention: 8 })
    const costly = compositeScore({ label: 'b', group: 'signals', emotion: 8, cognitive_load: 7, retention: 8 })
    expect(easy).toBeGreaterThan(costly)
  })

  it('reports watch state before stalled as each lane ages', () => {
    const watch = classifyGraphStalls({
      activePipelineCount: 2,
      overdueActions: STALL_THRESHOLDS.overdueActionsWatch,
      lastSignalDays: STALL_THRESHOLDS.signalsWatchDays,
      lastBriefDays: STALL_THRESHOLDS.briefWatchDays,
      signalsSinceBaseline: 0,
      pipelineChangesSinceBaseline: 0,
      briefReviewsSinceBaseline: 0,
    })
    expect(watch.map(s => s.state)).toEqual(['watch', 'watch', 'watch'])
    expect(watch.map(s => s.lane).sort()).toEqual(['pipeline', 'preparation', 'signals'])
  })

  it('stays silent when there has been activity since the baseline', () => {
    expect(classifyGraphStalls({
      activePipelineCount: 3,
      overdueActions: STALL_THRESHOLDS.overdueActionsStalled,
      lastSignalDays: STALL_THRESHOLDS.signalsStalledDays,
      lastBriefDays: STALL_THRESHOLDS.briefStalledDays,
      signalsSinceBaseline: 1,
      pipelineChangesSinceBaseline: 1,
      briefReviewsSinceBaseline: 1,
    })).toEqual([])
  })

  it('ignores the pipeline lane when nothing is active', () => {
    const stalls = classifyGraphStalls({
      activePipelineCount: 0,
      overdueActions: STALL_THRESHOLDS.overdueActionsStalled,
      lastSignalDays: 0,
      lastBriefDays: 0,
      signalsSinceBaseline: 1,
      pipelineChangesSinceBaseline: 0,
      briefReviewsSinceBaseline: 1,
    })
    expect(stalls).toEqual([])
  })

  it('falls back to vaguer wording for an unknown brief age', () => {
    const [prep] = classifyGraphStalls({
      activePipelineCount: 0,
      overdueActions: 0,
      lastSignalDays: 0,
      lastBriefDays: 400,
      signalsSinceBaseline: 1,
      pipelineChangesSinceBaseline: 1,
      briefReviewsSinceBaseline: 0,
    })
    expect(prep.reason).toBe('No recent brief review progress yet.')
  })

  it('singularises a lone overdue pipeline action', () => {
    const [pipeline] = classifyGraphStalls({
      activePipelineCount: 1,
      overdueActions: STALL_THRESHOLDS.overdueActionsWatch,
      lastSignalDays: 0,
      lastBriefDays: 0,
      signalsSinceBaseline: 1,
      pipelineChangesSinceBaseline: 0,
      briefReviewsSinceBaseline: 1,
    })
    expect(pipeline.reason).toContain(`${STALL_THRESHOLDS.overdueActionsWatch} overdue action`)
  })
})
