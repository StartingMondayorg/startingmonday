import { RESUME_CHARS } from '@/lib/ai-limits'
import type { CareerEntry } from '@/app/components/CareerVerificationPanel'

// Shared candidate-context builders for prep brief routes.
// Single source of truth so sub-sections (questions, why-here, background)
// personalize with the same verified inputs as the main brief.

export type StarStory = { id?: string; situation: string; action: string; result: string; tags?: string[] }

export type PrepCandidateProfile = {
  full_name?: string | null
  current_title?: string | null
  current_company?: string | null
  target_titles?: string[] | null
  target_sectors?: string[] | null
  positioning_summary?: string | null
  resume_text?: string | null
  beyond_resume?: string | null
  search_persona?: string | null
  role_type?: string | null
  career_history_json?: unknown | null
  star_stories?: unknown | null
}

/**
 * Career history block. Prefers candidate-verified structured history over
 * raw resume text; falls back to a resume excerpt when no verified entries exist.
 */
export function buildCareerHistorySection(profile: PrepCandidateProfile | null, resumeChars: number = RESUME_CHARS): string {
  if (!profile) return ''
  const entries = Array.isArray(profile.career_history_json) ? (profile.career_history_json as CareerEntry[]) : null
  if (entries && entries.length > 0) {
    const lines = entries.map(e => {
      const dates = `${e.start_year || '?'} to ${e.end_year || 'present'}`
      const company = e.parent_company ? `${e.company} (${e.parent_company})` : e.company
      const note = e.acquisition_note ? `\n  Context: ${e.acquisition_note}` : ''
      return `${company} | ${e.title} | ${dates}\n  ${e.key_outcome}${note}`
    }).join('\n\n')
    return `\n[Verified career history, confirmed by the candidate. Treat as authoritative. Do not infer or contradict these entries.]\n${lines}`
  }
  return profile.resume_text ? `\nResume / career history:\n${profile.resume_text.slice(0, resumeChars)}` : ''
}

/**
 * STAR stories block. `usageInstruction` tells the model how to apply the
 * stories in the specific section being generated.
 */
export function buildStarStoriesSection(
  profile: PrepCandidateProfile | null,
  usageInstruction: string = 'Where a story is relevant, reference it explicitly rather than inventing generic examples.',
): string {
  const stories = Array.isArray(profile?.star_stories) ? (profile.star_stories as StarStory[]) : []
  if (stories.length === 0) return ''
  const lines = stories.map((s, i) => {
    const tags = (s.tags ?? []).length > 0 ? ` [applies to: ${s.tags!.join(', ')}]` : ''
    return `Story ${i + 1}${tags}\n  Situation: ${s.situation}\n  Action: ${s.action}\n  Result: ${s.result}`
  }).join('\n\n')
  return `\n\nINTERVIEW STORIES (candidate-verified, treat as authoritative)\n${usageInstruction}\n${lines}`
}
