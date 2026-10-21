import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { checkProtectedDependencies, readApprovals } from '../../scripts/check-dependency-policy.mjs'

const workflowPath = new URL('../../.github/workflows/ci.yml', import.meta.url)
const noRecord = {}
const devRecord = { shadcn: { classification: 'devDependencies', approvedBy: 'richrothschild' } }

describe('protected dependency policy', () => {
  it('accepts shadcn as a production dependency without any approval', () => {
    expect(checkProtectedDependencies({
      dependencies: { shadcn: '^4.18.0' },
      devDependencies: {},
    }, '', noRecord)).toEqual([])
  })

  it('rejects moving shadcn to devDependencies without owner approval or a committed record', () => {
    expect(checkProtectedDependencies({
      dependencies: {},
      devDependencies: { shadcn: '^4.18.0' },
    }, '', noRecord)).toEqual([
      expect.stringContaining('not covered by config/dependency-policy-approvals.json'),
    ])
  })

  it('rejects removing shadcn without owner approval or a committed record', () => {
    expect(checkProtectedDependencies({ dependencies: {}, devDependencies: {} }, '', noRecord)).toEqual([
      expect.stringContaining('is missing from package.json'),
    ])
  })

  it('accepts a per-head exception only for the configured owner identity', () => {
    const removed = { dependencies: {}, devDependencies: {} }

    expect(checkProtectedDependencies(removed, 'someone-else', noRecord)).toHaveLength(1)
    expect(checkProtectedDependencies(removed, 'richrothschild', noRecord)).toEqual([])
  })

  it('accepts the classification recorded in a committed owner approval, and nothing else', () => {
    const dev = { dependencies: {}, devDependencies: { shadcn: '^4.22.1' } }
    const removed = { dependencies: {}, devDependencies: {} }

    expect(checkProtectedDependencies(dev, '', devRecord)).toEqual([])
    expect(checkProtectedDependencies(removed, '', devRecord)).toHaveLength(1)
    expect(checkProtectedDependencies(dev, '', { shadcn: { classification: 'devDependencies', approvedBy: 'someone-else' } })).toHaveLength(1)
  })

  it('ships a committed record that covers the repository as it stands', () => {
    const approvals = readApprovals()

    expect(approvals.shadcn?.approvedBy).toBe('richrothschild')
    expect(approvals.shadcn?.classification).toBe('devDependencies')
    expect(approvals.shadcn?.evidence).toContain('#527')
  })

  it('honours the committed record and still requires current-head approval evidence for departures in CI', async () => {
    const workflow = await readFile(workflowPath, 'utf8')

    expect(workflow).toContain("const approvalsPath = 'config/dependency-policy-approvals.json'")
    expect(workflow).toContain("approvals.shadcn?.approvedBy === 'richrothschild' && approvals.shadcn?.classification === classification")
    expect(workflow).toContain("review.user?.login === 'richrothschild'")
    expect(workflow).toContain('review.commit_id === headSha')
    expect(workflow).toContain('comment.user?.login === \'richrothschild\'')
    expect(workflow).toContain('`/approve-shadcn-change ${headSha}`')
    expect(workflow).toContain('SHADCN_CHANGE_APPROVED_BY: ${{ steps.shadcn-approval.outputs.approved_by }}')
  })
})