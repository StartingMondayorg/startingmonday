import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SHADCN_APPROVER = 'richrothschild'

const root = process.cwd()
const packageJsonPath = path.join(root, 'package.json')
const lockfilePath = path.join(root, 'package-lock.json')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function fail(lines) {
  for (const line of lines) console.error(line)
  process.exitCode = 1
}

function parseVersion(raw) {
  const input = String(raw || '').trim()
  const [core, pre = ''] = input.split('-')
  const [major, minor, patch] = core.split('.').map(n => Number.parseInt(n, 10))
  if (![major, minor, patch].every(Number.isFinite)) return null
  return { major, minor, patch, pre }
}

function compareVersions(aRaw, bRaw) {
  const a = parseVersion(aRaw)
  const b = parseVersion(bRaw)
  if (!a || !b) return Number.NaN
  if (a.major !== b.major) return a.major - b.major
  if (a.minor !== b.minor) return a.minor - b.minor
  if (a.patch !== b.patch) return a.patch - b.patch
  // Stable release is greater than prerelease for same major/minor/patch.
  if (!a.pre && b.pre) return 1
  if (a.pre && !b.pre) return -1
  return a.pre.localeCompare(b.pre)
}

function satisfiesExact(range, version) {
  return range === version
}

function satisfiesCaret(range, version) {
  const base = parseVersion(range.slice(1))
  const v = parseVersion(version)
  if (!base || !v) return false

  if (compareVersions(version, `${base.major}.${base.minor}.${base.patch}${base.pre ? `-${base.pre}` : ''}`) < 0) {
    return false
  }

  if (base.major > 0) {
    return v.major === base.major
  }
  if (base.minor > 0) {
    return v.major === 0 && v.minor === base.minor
  }
  return v.major === 0 && v.minor === 0 && v.patch === base.patch
}

function satisfiesRange(rangeRaw, version) {
  const range = rangeRaw.trim()
  if (!range) return false

  if (range.includes('||')) {
    return range.split('||').some(part => satisfiesRange(part, version))
  }

  if (range.startsWith('^')) return satisfiesCaret(range, version)

  // Treat bare versions as exact pins.
  return satisfiesExact(range, version)
}

function compareManifestWithLock(pkg, lock) {
  const issues = []
  const lockRoot = lock.packages?.['']
  if (!lockRoot) {
    issues.push('package-lock.json is missing packages[""]. Cannot validate lockfile consistency.')
    return issues
  }

  const sections = ['dependencies', 'devDependencies']
  for (const section of sections) {
    const pkgDeps = pkg[section] ?? {}
    const lockDeps = lockRoot[section] ?? {}

    const keys = new Set([...Object.keys(pkgDeps), ...Object.keys(lockDeps)])
    for (const name of keys) {
      const pkgSpec = pkgDeps[name]
      const lockSpec = lockDeps[name]
      if (pkgSpec !== lockSpec) {
        issues.push(
          `Lockfile mismatch in ${section}: ${name} package.json=${JSON.stringify(pkgSpec)} package-lock.json=${JSON.stringify(lockSpec)}`
        )
      }
    }
  }

  return issues
}

function checkNextSentryCompatibility(lock) {
  const issues = []
  const nextVersion = lock.packages?.['node_modules/next']?.version
  const sentryNode = lock.packages?.['node_modules/@sentry/nextjs']
  const sentryVersion = sentryNode?.version
  const nextPeerRange = sentryNode?.peerDependencies?.next

  if (!nextVersion) {
    issues.push('Unable to find installed next version in package-lock.json at packages["node_modules/next"].')
    return issues
  }
  if (!sentryVersion || !nextPeerRange) {
    issues.push('Unable to find @sentry/nextjs peer dependency metadata in package-lock.json.')
    return issues
  }

  if (!satisfiesRange(nextPeerRange, nextVersion)) {
    issues.push(
      `Incompatible dependency pair: next@${nextVersion} does not satisfy @sentry/nextjs@${sentryVersion} peer range (${nextPeerRange}).`
    )
  }

  return issues
}

export function checkProtectedDependencies(pkg, approvedBy = '') {
  const shadcnRuntimeSpec = pkg.dependencies?.shadcn
  const shadcnDevSpec = pkg.devDependencies?.shadcn
  const explicitlyApproved = approvedBy === SHADCN_APPROVER

  if (shadcnRuntimeSpec && !shadcnDevSpec) return []
  if (explicitlyApproved) return []

  if (shadcnDevSpec) {
    return [
      `Protected dependency shadcn must remain in dependencies, not devDependencies. Removal or reclassification requires a current-head approving review from ${SHADCN_APPROVER}.`,
    ]
  }

  return [
    `Protected dependency shadcn is missing from dependencies. Removal requires a current-head approving review from ${SHADCN_APPROVER}.`,
  ]
}

function main() {
  if (!fs.existsSync(packageJsonPath)) {
    fail(['package.json not found.'])
    return
  }
  if (!fs.existsSync(lockfilePath)) {
    fail(['package-lock.json not found. Commit the lockfile for deterministic installs.'])
    return
  }

  const pkg = readJson(packageJsonPath)
  const lock = readJson(lockfilePath)

  const issues = [
    ...compareManifestWithLock(pkg, lock),
    ...checkNextSentryCompatibility(lock),
    ...checkProtectedDependencies(pkg, process.env.SHADCN_CHANGE_APPROVED_BY),
  ]

  if (issues.length > 0) {
    fail([
      'Dependency policy check failed.',
      ...issues.map(i => `- ${i}`),
      '',
      'Fix by running npm install and committing updated package-lock.json, then confirm Next/Sentry versions are compatible.',
    ])
    return
  }

  console.log('Dependency policy check passed (lockfile consistency, Next/Sentry compatibility, and protected dependencies).')
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) main()
