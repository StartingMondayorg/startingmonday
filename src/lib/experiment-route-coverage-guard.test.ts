import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

type RouteExpectation = {
  file: string
  route: string
  requiredSnippets: string[]
}

const COVERAGE_EXPECTATIONS: RouteExpectation[] = [
  { file: 'src/app/(marketing)/for-cio/page.tsx', route: '/for-cio', requiredSnippets: ['TrackLink', 'EVENT_NAMES'] },
  { file: 'src/app/(marketing)/for-coaches/page.tsx', route: '/for-coaches', requiredSnippets: ['TrackLink', 'EVENT_NAMES'] },
  { file: 'src/app/(marketing)/for-cdo/page.tsx', route: '/for-cdo', requiredSnippets: ['LandingPage', 'sourcePage="/for-cdo"'] },
  { file: 'src/app/(marketing)/for-ciso/page.tsx', route: '/for-ciso', requiredSnippets: ['LandingPage', 'sourcePage="/for-ciso"'] },
  { file: 'src/app/(marketing)/for-cpo/page.tsx', route: '/for-cpo', requiredSnippets: ['LandingPage', 'sourcePage="/for-cpo"'] },
  { file: 'src/app/(marketing)/executives/page.tsx', route: '/executives', requiredSnippets: ['TrackLink', 'EVENT_NAMES'] },
  { file: 'src/app/(marketing)/executives/active/page.tsx', route: '/executives/active', requiredSnippets: ['TrackLink', 'EVENT_NAMES'] },
  { file: 'src/app/(marketing)/executives/passive/page.tsx', route: '/executives/passive', requiredSnippets: ['TrackLink', 'EVENT_NAMES'] },
]

describe('experiment route coverage guard', () => {
  it('keeps required conversion routes on TrackLink-based instrumentation', () => {
    for (const expected of COVERAGE_EXPECTATIONS) {
      const absolutePath = path.join(process.cwd(), expected.file)
      const source = fs.readFileSync(absolutePath, 'utf8')

      for (const snippet of expected.requiredSnippets) {
        expect(source.includes(snippet)).toBe(true)
      }
      expect(source.includes(expected.route)).toBe(true)
    }
  })
})
