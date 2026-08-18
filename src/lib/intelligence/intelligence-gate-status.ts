export type IntelligenceGateStatus = 'pass' | 'fail' | 'warn' | 'no_data' | 'in_progress'

export function rateGate(input: {
  numerator: number
  denominator: number
  maximumExclusive: number
}): { ratePercent: number | null; status: IntelligenceGateStatus } {
  if (input.denominator <= 0) {
    return { ratePercent: null, status: 'no_data' }
  }

  const ratePercent = (input.numerator / input.denominator) * 100
  return {
    ratePercent,
    status: ratePercent < input.maximumExclusive ? 'pass' : 'fail',
  }
}

export function coverageGate(input: {
  covered: number
  total: number
  targetPercent: number
}): { coveragePercent: number | null; status: IntelligenceGateStatus } {
  if (input.total <= 0) {
    return { coveragePercent: null, status: 'no_data' }
  }

  const coveragePercent = (input.covered / input.total) * 100
  return {
    coveragePercent,
    status: coveragePercent >= input.targetPercent ? 'pass' : 'warn',
  }
}