// Pure helpers behind FormDraftKeeper, kept DOM-light so they can be tested in node.

export type DraftField = {
  name: string
  type: string
  value: string
  checked?: boolean
}

export type FormDraft = Record<string, string | string[] | boolean>

const SKIP_TYPES = new Set(['password', 'file', 'hidden', 'submit', 'button', 'reset', 'image'])

export function isDraftableField(field: Pick<DraftField, 'name' | 'type'>): boolean {
  return Boolean(field.name) && !SKIP_TYPES.has(field.type)
}

export function serializeDraft(fields: DraftField[]): FormDraft {
  const draft: FormDraft = {}
  for (const field of fields) {
    if (!isDraftableField(field)) continue
    if (field.type === 'checkbox') {
      const existing = draft[field.name]
      if (Array.isArray(existing)) {
        if (field.checked) existing.push(field.value)
      } else if (existing === undefined) {
        draft[field.name] = field.checked ? [field.value] : []
      }
      continue
    }
    if (field.type === 'radio') {
      if (field.checked) draft[field.name] = field.value
      else if (draft[field.name] === undefined) draft[field.name] = ''
      continue
    }
    draft[field.name] = field.value
  }
  return draft
}

export function draftDiffers(draft: FormDraft, current: FormDraft): boolean {
  const keys = new Set([...Object.keys(draft), ...Object.keys(current)])
  for (const key of keys) {
    const a = draft[key]
    const b = current[key]
    if (Array.isArray(a) || Array.isArray(b)) {
      const aa = Array.isArray(a) ? [...a].sort() : []
      const bb = Array.isArray(b) ? [...b].sort() : []
      if (aa.length !== bb.length || aa.some((v, i) => v !== bb[i])) return true
      continue
    }
    if ((a ?? '') !== (b ?? '')) return true
  }
  return false
}

export function parseDraft(raw: string | null): FormDraft | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return parsed as FormDraft
  } catch {
    return null
  }
}
