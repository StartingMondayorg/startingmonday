import { readFile } from 'node:fs/promises'
import path from 'node:path'

export async function readGuideRuntimeFile(fileName: string): Promise<string> {
  const candidates = [
    path.join(process.cwd(), 'docs', fileName),
    path.join(process.cwd(), '.next', 'server', 'guide-data', fileName),
  ]

  for (const filePath of candidates) {
    try {
      return await readFile(filePath, 'utf8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }

  return ''
}