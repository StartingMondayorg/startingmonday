import { PREP_ROLE_MODES, type PrepRoleMode } from '@/lib/prep/prep-role-modes'
import type { InterviewStage } from '@/lib/ai/prompts'

export const STAGE_OPTIONS: { value: InterviewStage; label: string }[] = [
  { value: 'informal_meeting', label: 'Informal Meeting' },
  { value: 'first_interview', label: 'First Interview' },
  { value: 'executive_interview', label: 'Executive Interview' },
  { value: 'board_presentation', label: 'Board Presentation' },
  { value: 'final_round', label: 'Final Round' },
]

export const DEFAULT_INTERVIEW_STAGE: Record<string, InterviewStage> = {
  watching: 'executive_interview',
  researching: 'executive_interview',
  applied: 'informal_meeting',
  interviewing: 'first_interview',
  offer: 'final_round',
}

export const ROLE_MODE_OPTIONS: { value: PrepRoleMode; label: string }[] = [
  { value: 'cio', label: 'CIO' },
  { value: 'cto', label: 'CTO' },
  { value: 'ciso', label: 'CISO' },
  { value: 'vp_to_cxo', label: 'VP to CXO' },
]

export function inferInitialRoleMode(roleType: string | null): PrepRoleMode {
  if (PREP_ROLE_MODES.includes((roleType ?? '').toLowerCase() as PrepRoleMode)) {
    return roleType!.toLowerCase() as PrepRoleMode
  }
  return 'vp_to_cxo'
}
