import { execSync } from 'node:child_process'

export function gitRefExists(ref) {
  if (!ref) return false
  try {
    execSync(`git rev-parse --verify --quiet ${ref}`, {
      stdio: ['ignore', 'ignore', 'ignore'],
    })
    return true
  } catch {
    return false
  }
}

export function isAncestor(baseRef, headRef) {
  try {
    execSync(`git merge-base --is-ancestor ${baseRef} ${headRef}`, {
      stdio: ['ignore', 'ignore', 'ignore'],
    })
    return true
  } catch {
    return false
  }
}

export function resolveDiffScope(baseRef, headRef) {
  if (!baseRef) {
    return { effectiveBaseRef: '', skip: false }
  }

  if (!gitRefExists(headRef)) {
    return {
      effectiveBaseRef: '',
      skip: true,
      reason: `head ref not found: ${headRef}`,
    }
  }

  if (!gitRefExists(baseRef)) {
    return {
      effectiveBaseRef: '',
      skip: true,
      reason: `base ref not found: ${baseRef}`,
    }
  }

  if (!isAncestor(baseRef, headRef)) {
    return {
      effectiveBaseRef: '',
      skip: true,
      reason: `base ref is not an ancestor of head (${baseRef} !< ${headRef})`,
    }
  }

  return { effectiveBaseRef: baseRef, skip: false }
}
