#!/usr/bin/env node
import { copyFile, mkdir, readdir, rm } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const targetDir = path.join(root, '.next', 'server', 'outreach-data')
const sourceCandidates = [
  path.join(root, 'docs', 'outreach'),
  path.join(root, 'outreach'),
]

let sourceDir
let files = []
for (const candidate of sourceCandidates) {
  try {
    files = (await readdir(candidate)).filter((fileName) => fileName.endsWith('.csv'))
    if (files.length > 0) {
      sourceDir = candidate
      break
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}

if (!sourceDir) {
  throw new Error('No outreach CSV files found for runtime packaging')
}

await rm(targetDir, { recursive: true, force: true })
await mkdir(targetDir, { recursive: true })
await Promise.all(files.map((fileName) => (
  copyFile(path.join(sourceDir, fileName), path.join(targetDir, fileName))
)))

console.log(`Packaged ${files.length} outreach CSV files for runtime`)