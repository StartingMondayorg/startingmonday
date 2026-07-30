export type ParsedBriefingJson = Record<string, unknown>

function removeTrailingJsonCommas(value: string): string {
  let repaired = ''
  let inString = false
  let escaped = false

  for (let index = 0; index < value.length; index++) {
    const character = value[index]

    if (inString) {
      repaired += character
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === '"') inString = false
      continue
    }

    if (character === '"') {
      inString = true
      repaired += character
      continue
    }

    if (character === ',') {
      let nextIndex = index + 1
      while (/\s/.test(value[nextIndex] ?? '')) nextIndex++
      if (value[nextIndex] === '}' || value[nextIndex] === ']') continue
    }

    repaired += character
  }

  return repaired
}

function parseObject(value: string): ParsedBriefingJson | null {
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as ParsedBriefingJson
      : null
  } catch {
    return null
  }
}

export function parseBriefingJson(value: string): ParsedBriefingJson | null {
  const cleaned = value
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```$/, '')
    .trim()

  return parseObject(cleaned) ?? parseObject(removeTrailingJsonCommas(cleaned))
}