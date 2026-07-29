#!/usr/bin/env node
import { copyFile, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const sourceDir = path.join(root, 'docs')
const targetDir = path.join(root, '.next', 'server', 'guide-data')
const files = [
  'user-guide.md',
  'user-guide.index.json',
  'internal-guide.md',
  'internal-guide.index.json',
]

await rm(targetDir, { recursive: true, force: true })
await mkdir(targetDir, { recursive: true })
await Promise.all(files.map((fileName) => (
  copyFile(path.join(sourceDir, fileName), path.join(targetDir, fileName))
)))

console.log(`Packaged ${files.length} guide files for runtime`)