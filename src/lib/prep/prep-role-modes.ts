export const PREP_ROLE_MODES = ['cio', 'cto', 'ciso', 'vp_to_cxo'] as const

export type PrepRoleMode = (typeof PREP_ROLE_MODES)[number]

const ROLE_MODE_PACKS: Record<PrepRoleMode, string> = {
  cio: [
    'ROLE MODE: CIO',
    '- Prioritize business capability enablement, governance cadence, and cross-functional trust.',
    '- Emphasize operating model clarity: decision rights, architecture governance, and KPI ownership.',
    '- Anticipate board questions on resilience, spend discipline, and transformation sequencing.',
  ].join('\n'),
  cto: [
    'ROLE MODE: CTO',
    '- Prioritize platform velocity, engineering quality, and technical risk retirement.',
    '- Emphasize architecture choices and tradeoffs with measurable delivery outcomes.',
    '- Anticipate pushback on scaling teams, roadmap realism, and execution reliability.',
  ].join('\n'),
  ciso: [
    'ROLE MODE: CISO',
    '- Prioritize risk reduction posture, control maturity, and incident readiness.',
    '- Emphasize executive communication of risk in business terms and governance routines.',
    '- Anticipate pushback on cost, user friction, and security-business balance.',
  ].join('\n'),
  vp_to_cxo: [
    'ROLE MODE: VP-to-CXO Transition',
    '- Prioritize scope expansion narrative and enterprise-level decision posture.',
    '- Emphasize mandate readiness: strategy, organizational leadership, and board communication.',
    '- Anticipate pushback on altitude shift, scale proof, and executive presence.',
  ].join('\n'),
}

export function isPrepRoleMode(value: string | null): value is PrepRoleMode {
  if (!value) return false
  return PREP_ROLE_MODES.includes(value as PrepRoleMode)
}

export function getRoleModePromptPack(mode: PrepRoleMode | null): string {
  if (!mode) return ''
  return `\n\n${ROLE_MODE_PACKS[mode]}`
}
