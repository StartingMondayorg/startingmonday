import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { checkProtectedDependencies } from '../../scripts/check-dependency-policy.mjs'

const workflowPath = new URL('../../.github/workflows/ci.yml', import.meta.url)

describe('protected dependency policy', () => {
  it('requires shadcn to remain a production dependency', () => {
    expect(checkProtectedDependencies({
      dependencies: { shadcn: '^4.18.0' },
      devDependencies: {},
    })).toEqual([])
  })

  it('rejects moving shadcn to devDependencies without owner approval', () => {
    expect(checkProtectedDependencies({
      dependencies: {},
      devDependencies: { shadcn: '^4.18.0' },
    })).toEqual([
      expect.stringContaining('must remain in dependencies'),
    ])
  })

  it('rejects removing shadcn without owner approval', () => {
    expect(checkProtectedDependencies({ dependencies: {}, devDependencies: {} })).toEqual([
      expect.stringContaining('is missing from dependencies'),
    ])
  })

  it('accepts an exception only for the configured owner identity', () => {
    const removed = { dependencies: {}, devDependencies: {} }

    expect(checkProtectedDependencies(removed, 'someone-else')).toHaveLength(1)
    expect(checkProtectedDependencies(removed, 'richrothschild')).toEqual([])
  })

  it('requires current-head approval evidence from the owner in CI', async () => {
    const workflow = await readFile(workflowPath, 'utf8')

    expect(workflow).toContain("review.user?.login === 'richrothschild'")
    expect(workflow).toContain('review.commit_id === headSha')
    expect(workflow).toContain('comment.user?.login === \'richrothschild\'')
    expect(workflow).toContain('`/approve-shadcn-change ${headSha}`')
    expect(workflow).toContain('SHADCN_CHANGE_APPROVED_BY: ${{ steps.shadcn-approval.outputs.approved_by }}')
  })
})