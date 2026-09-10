// Deterministic validation of an agent-authored diff, run before anything is
// applied or pushed. The agent is told what it may touch; this is what enforces
// it. Every rule here answers "what could a confused or manipulated agent do
// that we could not undo cheaply".

export type PatchViolation = { rule: string; detail: string }

export type PatchReport = {
  ok: boolean
  files: string[]
  addedLines: number
  removedLines: number
  violations: PatchViolation[]
}

export const MAX_FILES = 10
export const MAX_CHANGED_LINES = 300

// Only application code. Tests are included so a fix can carry its regression
// test -- a fix without one is usually not a fix.
const ALLOWED = /^(src|worker|tests)\//

// Checked before the allow-list so the message names the real reason. These are
// the paths where a change is either unreviewable, self-modifying, or capable of
// altering what runs in CI.
const FORBIDDEN: Array<{ pattern: RegExp; rule: string }> = [
  { pattern: /^\.github\//, rule: 'workflow-or-action' },
  { pattern: /(^|\/)package(-lock)?\.json$/, rule: 'dependency-manifest' },
  { pattern: /^supabase\/migrations\//, rule: 'database-migration' },
  { pattern: /(^|\/)\.env/, rule: 'environment-file' },
  { pattern: /^scripts\/check-/, rule: 'guard-script' },
  { pattern: /^src\/lib\/incident\//, rule: 'incident-loop-self-modification' },
  { pattern: /(^|\/)\.gitleaks\.toml$/, rule: 'secret-scanner-config' },
]

/** Paths from `diff --git a/X b/Y`, covering renames and new/deleted files. */
export function filesInPatch(patch: string): string[] {
  const files = new Set<string>()
  for (const line of patch.split('\n')) {
    const match = line.match(/^diff --git a\/(.+?) b\/(.+)$/)
    if (!match) continue
    for (const path of [match[1], match[2]]) {
      if (path !== '/dev/null') files.add(path)
    }
  }
  return [...files]
}

function countChanges(patch: string): { added: number; removed: number } {
  let added = 0
  let removed = 0
  for (const line of patch.split('\n')) {
    // +++/--- are file headers, not content.
    if (line.startsWith('+++') || line.startsWith('---')) continue
    if (line.startsWith('+')) added += 1
    else if (line.startsWith('-')) removed += 1
  }
  return { added, removed }
}

export function validatePatch(patch: string): PatchReport {
  const violations: PatchViolation[] = []
  const files = filesInPatch(patch)
  const { added, removed } = countChanges(patch)

  if (!patch.trim()) {
    violations.push({ rule: 'empty', detail: 'patch is empty' })
  } else if (files.length === 0) {
    violations.push({ rule: 'unparseable', detail: 'no "diff --git" headers found' })
  }

  for (const file of files) {
    // Normalising first means ../ cannot smuggle a path past the allow-list.
    if (file.includes('..')) {
      violations.push({ rule: 'path-traversal', detail: file })
      continue
    }
    if (file.startsWith('/')) {
      violations.push({ rule: 'absolute-path', detail: file })
      continue
    }
    const forbidden = FORBIDDEN.find(f => f.pattern.test(file))
    if (forbidden) {
      violations.push({ rule: forbidden.rule, detail: file })
      continue
    }
    if (!ALLOWED.test(file)) {
      violations.push({ rule: 'outside-allowed-paths', detail: file })
    }
  }

  if (files.length > MAX_FILES) {
    violations.push({ rule: 'too-many-files', detail: `${files.length} > ${MAX_FILES}` })
  }
  if (added + removed > MAX_CHANGED_LINES) {
    violations.push({
      rule: 'too-many-lines',
      detail: `${added + removed} > ${MAX_CHANGED_LINES}`,
    })
  }

  return { ok: violations.length === 0, files, addedLines: added, removedLines: removed, violations }
}

export function describeViolations(report: PatchReport): string {
  return report.violations.map(v => `${v.rule}: ${v.detail}`).join('; ')
}
