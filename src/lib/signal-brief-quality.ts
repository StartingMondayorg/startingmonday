import type { SignalBriefInput, SignalBriefProfile } from './signal-brief-renderer'

const QUESTION_COUNTS = {
  situation: 2,
  problem: 3,
  implication: [2, 3],
  need_payoff: 2,
} as const

const INVESTIGATE_FIRST_PATTERN = /\b(public record suggests|confirm (?:this|it|the)|investigat(?:e|ing)|before proposing)\b/i

export function validateSignalBriefQuality(input: SignalBriefInput): void {
  for (const profile of input.profiles) {
    validateProfile(profile)
  }
}

function validateProfile(profile: SignalBriefProfile): void {
  const questions = profile.discovery_questions
  if (questions.situation.length !== QUESTION_COUNTS.situation) throw new Error(`Signal brief Situation questions must contain exactly 2 items: ${profile.account}`)
  if (questions.problem.length !== QUESTION_COUNTS.problem) throw new Error(`Signal brief Problem questions must contain exactly 3 items: ${profile.account}`)
  if (!QUESTION_COUNTS.implication.includes(questions.implication.length as 2 | 3)) throw new Error(`Signal brief Implication questions must contain 2 or 3 items: ${profile.account}`)
  if (questions.need_payoff.length !== QUESTION_COUNTS.need_payoff) throw new Error(`Signal brief Need-payoff questions must contain exactly 2 items: ${profile.account}`)
  if (!INVESTIGATE_FIRST_PATTERN.test(profile.positioning)) throw new Error(`Signal brief positioning must be an investigate-first hypothesis: ${profile.account}`)
  if (!INVESTIGATE_FIRST_PATTERN.test(profile.suggested_move)) throw new Error(`Signal brief suggested move must begin with investigation: ${profile.account}`)
}
