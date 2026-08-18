const RELATIVE_TIME_PHRASE_REGEX = /\s*(?:--\s*)?(?:it\s+|it'?s\s+)?has\s+been\s+[\w-]+\s+days?(?:\s+since[^.]*)?\.?/gi

export function stripStaleRelativeTime(value: string): string {
  return value.replace(RELATIVE_TIME_PHRASE_REGEX, '').replace(/\s{2,}/g, ' ').trim()
}
