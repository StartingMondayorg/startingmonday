import { describe, expect, it } from 'vitest'
import { buildLabelAndBacktestGates } from './intelligence-label-gates'

describe('intelligence label and backtest gates', () => {
  it('fails closed when labels and backtests have no data', () => {
    const gates = buildLabelAndBacktestGates({
      openingCount: 0,
      labelCount: 0,
      labelSourceCount: 0,
      precursorStatCount: 0,
      cohortCount: 0,
      controlCount: 0,
      patternCount: 0,
      latestReplayStatus: null,
    })

    expect(gates.labeledOpenings.status).toBe('in_progress')
    expect(gates.precursorStats.status).toBe('no_data')
    expect(gates.matchedControls.status).toBe('no_data')
    expect(gates.patternBacktests.status).toBe('no_data')
  })

  it('passes only when declared volume and replay gates are met', () => {
    const gates = buildLabelAndBacktestGates({
      openingCount: 500,
      labelCount: 1000,
      labelSourceCount: 4,
      precursorStatCount: 8,
      cohortCount: 300,
      controlCount: 900,
      patternCount: 12,
      latestReplayStatus: 'complete',
    })

    expect(Object.values(gates).every((gate) => gate.status === 'pass')).toBe(true)
  })
})