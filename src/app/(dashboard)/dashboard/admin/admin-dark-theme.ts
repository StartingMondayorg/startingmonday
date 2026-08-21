export const ADMIN_DARK_PAGE_BG =
  'min-h-screen bg-card/85 font-sans text-foreground'

export const ADMIN_DARK_STAT_CARD =
  'rounded-2xl border border-border bg-muted/40 p-4 shadow-lg backdrop-blur-md'

export const ADMIN_DARK_SECTION_CARD =
  'rounded-2xl border border-border bg-muted/40 p-5 mb-6 shadow-lg backdrop-blur-md'

export const ADMIN_DARK_ACTION_CARD =
  'block rounded-xl border border-border bg-background/40 p-4 hover:border-border transition-colors'

export const ADMIN_DARK_TABLE_PANEL =
  'rounded-2xl border border-border bg-muted/40 overflow-hidden mb-6 shadow-lg backdrop-blur-md'

export const ADMIN_DARK_SUB_CARD =
  'border border-border bg-background/60 rounded'

export const ADMIN_DARK_FIELD_BASE =
  'border border-border bg-background/60 rounded text-foreground focus:outline-none focus:border-border'

export const ADMIN_DARK_FIELD_MD = `${ADMIN_DARK_FIELD_BASE} px-3 py-2`

export const ADMIN_DARK_FIELD_SM = `${ADMIN_DARK_FIELD_BASE} px-2 py-1.5`

export const ADMIN_DARK_BUTTON_BASE =
  'font-semibold text-foreground bg-muted/60 border border-border hover:bg-muted/80 rounded transition-colors disabled:opacity-40 cursor-pointer'

export const ADMIN_DARK_BUTTON_SM = `${ADMIN_DARK_BUTTON_BASE} text-[12px] px-3 py-1`

export const ADMIN_DARK_BUTTON_MD = `${ADMIN_DARK_BUTTON_BASE} text-[13px] px-5 py-2`

export const ADMIN_DARK_MUTED_ACTION =
  'text-[12px] text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0'

export function adminRoleBadgeClass(role: string): string {
  if (role === 'owner') return 'bg-warning/15 text-warning border border-warning/25'
  if (role === 'admin') return 'bg-info/15 text-info border border-info/25'
  return 'bg-muted/60 text-muted-foreground border border-border'
}