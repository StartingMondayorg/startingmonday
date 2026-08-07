import { scorePharmaSignal, shouldSurfacePharmaSignal, type PharmaSignalInput } from '@/lib/pharma-signal-scoring'

export type PharmaPilotSignal = PharmaSignalInput & {
  id: string
  createdAt: string
}

export type PharmaPilotSummary = {
  totalSignals: number
  surfacedSignals: number
  highConfidenceSignals: number
  mediumConfidenceSignals: number
  lowConfidenceSignals: number
  averageScore: number
}

export function summarizePharmaPilotSignals(signals: PharmaPilotSignal[]): PharmaPilotSummary {
  const scored = signals.map((signal) => ({
    ...signal,
    score: scorePharmaSignal(signal),
  }))

  const surfacedSignals = scored.filter((signal) => shouldSurfacePharmaSignal(signal)).length
  const highConfidenceSignals = scored.filter((signal) => signal.score.confidenceTier === 'high').length
  const mediumConfidenceSignals = scored.filter((signal) => signal.score.confidenceTier === 'medium').length
  const lowConfidenceSignals = scored.filter((signal) => signal.score.confidenceTier === 'low').length
  const averageScore = scored.length > 0
    ? scored.reduce((sum, signal) => sum + signal.score.score, 0) / scored.length
    : 0

  return {
    totalSignals: scored.length,
    surfacedSignals,
    highConfidenceSignals,
    mediumConfidenceSignals,
    lowConfidenceSignals,
    averageScore,
  }
}
