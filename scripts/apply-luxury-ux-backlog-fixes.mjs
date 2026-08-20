#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

function getArg(name, fallback = null) {
  const prefix = `--${name}=`
  const arg = process.argv.find((value) => value.startsWith(prefix))
  if (!arg) return fallback
  return arg.slice(prefix.length)
}

const inputPath = getArg('input', 'tmp/luxury-ux-all-pages.json')

function readJson(relativePath) {
  const fullPath = path.join(ROOT, relativePath)
  if (!fs.existsSync(fullPath)) throw new Error(`Report not found: ${relativePath}`)
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'))
}

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function writeText(relativePath, content) {
  fs.writeFileSync(path.join(ROOT, relativePath), content)
}

function replaceNth(text, find, replacement, index) {
  let count = 0
  return text.replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), (match) => {
    count += 1
    if (count === index) return replacement
    return match
  })
}

const report = readJson(inputPath)
if (!Array.isArray(report.results)) throw new Error('Invalid report format: missing results[]')

let touched = 0
let tinyFixedFiles = 0
let uppercaseFixedFiles = 0
let repeatedCtaFixedFiles = 0

for (const result of report.results) {
  if (!result.issues || result.issues.length === 0) continue

  const filePath = result.relativePath
  const fullPath = path.join(ROOT, filePath)
  if (!fs.existsSync(fullPath)) continue

  let content = readText(filePath)
  const original = content

  const hasTinyIssue = result.issues.some((issue) => issue.startsWith('tiny-text-heavy'))
  const hasUppercaseIssue = result.issues.some((issue) => issue.startsWith('excess-uppercase-micro-labels'))
  const hasRepeatedCtaIssue = result.issues.some((issue) => issue.startsWith('repeated-cta-labels'))

  if (hasTinyIssue) {
    content = content
      .replace(/text-\[10px\]/g, 'text-[13px]')
      .replace(/text-\[11px\]/g, 'text-[13px]')
      .replace(/text-\[12px\]/g, 'text-[13px]')
    tinyFixedFiles += 1
  }

  if (hasUppercaseIssue) {
    content = content.replace(/uppercase\s+tracking/g, 'tracking')
    uppercaseFixedFiles += 1
  }

  if (hasRepeatedCtaIssue && filePath === 'src/app/(marketing)/intelligence/[slug]/page.tsx') {
    // Keep first CTA label, diversify following duplicates to avoid repeated-label overload.
    content = replaceNth(content, 'Get started now', 'Start free trial', 2)
    content = replaceNth(content, 'Get started now', 'Create free account', 3)
    repeatedCtaFixedFiles += 1
  }

  if (content !== original) {
    writeText(filePath, content)
    touched += 1
  }
}

console.log(`Applied fixes to ${touched} file(s)`)
console.log(`tiny-text fix targets: ${tinyFixedFiles}`)
console.log(`uppercase fix targets: ${uppercaseFixedFiles}`)
console.log(`repeated-cta fix targets: ${repeatedCtaFixedFiles}`)
