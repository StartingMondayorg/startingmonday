import type {
  SignalBriefDiscoveryQuestions,
  SignalBriefEvidence,
  SignalBriefImplicationMath,
  SignalBriefInput,
  SignalBriefProfile,
} from './signal-brief-renderer'

type RawSignalBriefAccount = {
  account: string
  positioning: string
  suggested_move: string
  discovery_questions: SignalBriefDiscoveryQuestions
  evidence: SignalBriefEvidence[]
}

export type RawSignalBriefPayload = {
  title: string
  reader: string
  client_config: {
    avg_deal_value: number
    win_rate: number
    lift_statement: string
    problems: [string, string, string]
    what_it_does: [string, string, string]
    cost_to_reader: string
  }
  profiles: RawSignalBriefAccount[]
  method_note?: string
}

function assertNonEmpty(value: string, field: string): string {
  if (!value.trim()) throw new Error(`Signal brief field is required: ${field}`)
  return value.trim()
}

function assertEvidence(evidence: SignalBriefEvidence[], account: string): SignalBriefEvidence[] {
  if (evidence.length === 0) throw new Error(`Signal brief evidence is required: ${account}`)
  return evidence.map((item, index) => {
    const date = assertNonEmpty(item.date, `${account}.evidence[${index}].date`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Signal brief evidence date must be YYYY-MM-DD: ${account}.evidence[${index}].date`)
    const sourceUrl = assertNonEmpty(item.source_url, `${account}.evidence[${index}].source_url`)
    if (!/^https:\/\//i.test(sourceUrl)) throw new Error(`Signal brief evidence source must use HTTPS: ${account}.evidence[${index}].source_url`)
    return { date, event: assertNonEmpty(item.event, `${account}.evidence[${index}].event`), source_url: sourceUrl }
  })
}

function assertQuestions(questions: SignalBriefDiscoveryQuestions, account: string): SignalBriefDiscoveryQuestions {
  for (const key of ['situation', 'problem', 'implication', 'need_payoff'] as const) {
    if (!Array.isArray(questions[key]) || questions[key].length === 0) throw new Error(`Signal brief ${key} questions are required: ${account}`)
  }
  return questions
}

function assertTriple(items: string[], field: string): [string, string, string] {
  if (items.length !== 3) throw new Error(`Signal brief field must contain exactly three items: ${field}`)
  return items.map((item, index) => assertNonEmpty(item, `${field}[${index}]`)) as [string, string, string]
}

function mapProfile(profile: RawSignalBriefAccount): SignalBriefProfile {
  const account = assertNonEmpty(profile.account, 'profiles[].account')
  return {
    account,
    positioning: assertNonEmpty(profile.positioning, `${account}.positioning`),
    suggested_move: assertNonEmpty(profile.suggested_move, `${account}.suggested_move`),
    discovery_questions: assertQuestions(profile.discovery_questions, account),
    evidence: assertEvidence(profile.evidence, account),
  }
}

function mapImplicationMath(config: RawSignalBriefPayload['client_config']): SignalBriefImplicationMath {
  if (!Number.isFinite(config.avg_deal_value) || config.avg_deal_value <= 0) throw new Error('Signal brief avg_deal_value must be greater than zero')
  if (!Number.isFinite(config.win_rate) || config.win_rate <= 0 || config.win_rate > 1) throw new Error('Signal brief win_rate must be between zero and one')
  return {
    deal_value: config.avg_deal_value,
    win_rate: config.win_rate,
    lift_statement: assertNonEmpty(config.lift_statement, 'client_config.lift_statement'),
  }
}

export function adaptSignalBriefPayload(payload: RawSignalBriefPayload): SignalBriefInput {
  const config = payload.client_config
  return {
    title: assertNonEmpty(payload.title, 'title'),
    reader: assertNonEmpty(payload.reader, 'reader'),
    problems: assertTriple(config.problems, 'client_config.problems'),
    implication_math: mapImplicationMath(config),
    what_it_does: assertTriple(config.what_it_does, 'client_config.what_it_does'),
    cost_to_reader: assertNonEmpty(config.cost_to_reader, 'client_config.cost_to_reader'),
    profiles: payload.profiles.map(mapProfile),
    method_note: payload.method_note?.trim() || undefined,
  }
}
