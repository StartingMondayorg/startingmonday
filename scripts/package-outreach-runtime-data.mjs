#!/usr/bin/env node
import { copyFile, mkdir, readdir, rm } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const sourceDir = path.join(root, 'docs', 'outreach')
const targetDir = path.join(root, '.next', 'server', 'outreach-data')
const files = (await readdir(sourceDir)).filter((fileName) => fileName.endsWith('.csv'))

if (files.length === 0) {
  throw new Error('No outreach CSV files found for runtime packaging')
}

await rm(targetDir, { recursive: true, force: true })
await mkdir(targetDir, { recursive: true })
await Promise.all(files.map((fileName) => (
  copyFile(path.join(sourceDir, fileName), path.join(targetDir, fileName))
)))

console.log(`Packaged ${files.length} outreach CSV files for runtime`)