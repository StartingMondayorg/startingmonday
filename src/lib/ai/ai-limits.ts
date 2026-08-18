// Token/character budgets for AI prompt construction.
// All truncation in routes and UI should reference these constants.

export const RESUME_CHARS = 6000   // resume_text included in any AI prompt
export const DOC_CHARS    = 4000   // per-document content included in prep prompt
export const PREVIEW_CHARS = 220   // document content preview shown in company detail UI
