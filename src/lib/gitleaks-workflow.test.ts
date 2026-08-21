import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const workflowPath = new URL('../../.github/workflows/gitleaks.yml', import.meta.url)

describe('Gitleaks workflow', () => {
  it('uses the pinned license-free CLI across pull request, push, and scheduled ranges', async () => {
    const workflow = await readFile(workflowPath, 'utf8')

    expect(workflow).not.toContain('gitleaks/gitleaks-action')
    expect(workflow).not.toContain('GITLEAKS_LICENSE')
    expect(workflow).toContain('gitleaks_8.30.1_linux_x64.tar.gz')
    expect(workflow).toContain('PR_BASE_SHA: ${{ github.event.pull_request.base.sha }}')
    expect(workflow).toContain('PUSH_BEFORE_SHA: ${{ github.event.before }}')
    expect(workflow).toContain('RANGE="--all"')
    expect(workflow).toContain('gitleaks git --redact --no-banner --config .gitleaks.toml --log-opts="$RANGE"')
  })
})