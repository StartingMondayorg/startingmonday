export type SignalBriefDiscoveryQuestions = {
  situation: string[]
  problem: string[]
  implication: string[]
  need_payoff: string[]
}

export type SignalBriefImplicationMath = {
  deal_value: number
  win_rate: number
  lift_statement: string
}

export type SignalBriefProfile = {
  account: string
  positioning: string
  suggested_move: string
  discovery_questions: SignalBriefDiscoveryQuestions
}

export type SignalBriefInput = {
  title: string
  reader: string
  problems: [string, string, string]
  implication_math: SignalBriefImplicationMath
  what_it_does: [string, string, string]
  cost_to_reader: string
  profiles: SignalBriefProfile[]
  method_note?: string
}

const DISCOVERY_GROUPS: Array<{ key: keyof SignalBriefDiscoveryQuestions; label: string }> = [
  { key: 'situation', label: 'Situation' },
  { key: 'problem', label: 'Problem' },
  { key: 'implication', label: 'Implication' },
  { key: 'need_payoff', label: 'Need-payoff' },
]

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function renderList(items: readonly string[], className: string): string {
  return `<ul class="${className}">${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
}

function renderDiscoveryQuestions(questions: SignalBriefDiscoveryQuestions): string {
  return `<section class="discovery-questions"><h3>Discovery questions</h3>${DISCOVERY_GROUPS.map(({ key, label }) => `<div class="discovery-group"><h4>${label}</h4>${renderList(questions[key], 'question-list')}</div>`).join('')}</section>`
}

function renderProfile(profile: SignalBriefProfile): string {
  return `<article class="profile"><h2>${escapeHtml(profile.account)}</h2><section><h3>Positioning</h3><p>${escapeHtml(profile.positioning)}</p></section><section><h3>Tactics</h3><p>${escapeHtml(profile.suggested_move)}</p></section>${renderDiscoveryQuestions(profile.discovery_questions)}</article>`
}

export function renderSignalBrief(input: SignalBriefInput): string {
  const expectedValue = input.implication_math.deal_value * input.implication_math.win_rate
  const profiles = input.profiles.map(renderProfile).join('')
  const methodNote = input.method_note ? `<footer><h2>Method note</h2><p>${escapeHtml(input.method_note)}</p></footer>` : ''

  return `<main class="signal-brief"><header class="value-cover"><p class="eyebrow">Signal intelligence brief</p><h1>${escapeHtml(input.title)}</h1><p class="reader">Prepared for ${escapeHtml(input.reader)}</p></header><section class="value-cover-problems"><h2>What is already costing your week</h2>${renderList(input.problems, 'problem-list')}</section><section class="value-cover-implication"><h2>Why timing changes the economics</h2><p>${formatCurrency(input.implication_math.deal_value)} average deal value x ${(input.implication_math.win_rate * 100).toFixed(0)}% baseline win rate = <strong>${formatCurrency(expectedValue)}</strong> expected value.</p><p>${escapeHtml(input.implication_math.lift_statement)}</p></section><section class="value-cover-solution"><h2>What this document does about it</h2>${renderList(input.what_it_does, 'solution-list')}</section><section class="value-cover-cost"><h2>What it costs you</h2><p>${escapeHtml(input.cost_to_reader)}</p></section><section class="profiles"><h2>Account briefs</h2>${profiles}</section>${methodNote}</main>`
}
