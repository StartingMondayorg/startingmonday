import assert from 'node:assert/strict'
import test from 'node:test'
import { checkProtectedDependencies, classifyShadcn } from './check-dependency-policy.mjs'

const devPkg = { dependencies: {}, devDependencies: { shadcn: '^4.22.1' } }
const runtimePkg = { dependencies: { shadcn: '^4.18.0' }, devDependencies: {} }
const absentPkg = { dependencies: {}, devDependencies: {} }
const recorded = { shadcn: { classification: 'devDependencies', approvedBy: 'richrothschild' } }

test('classifyShadcn reports where the CLI lives', () => {
  assert.equal(classifyShadcn(runtimePkg), 'dependencies')
  assert.equal(classifyShadcn(devPkg), 'devDependencies')
  assert.equal(classifyShadcn(absentPkg), 'absent')
  assert.equal(classifyShadcn({ dependencies: { shadcn: '1' }, devDependencies: { shadcn: '1' } }), 'both')
})

test('runtime classification never needs approval', () => {
  assert.deepEqual(checkProtectedDependencies(runtimePkg, '', {}), [])
})

test('a committed owner record covers the recorded classification without a per-head approval', () => {
  assert.deepEqual(checkProtectedDependencies(devPkg, '', recorded), [])
})

test('the record does not cover a classification it did not approve', () => {
  const issues = checkProtectedDependencies(absentPkg, '', recorded)
  assert.equal(issues.length, 1)
  assert.match(issues[0], /missing from package\.json/)
})

test('a record signed by someone other than the approver is ignored', () => {
  const issues = checkProtectedDependencies(devPkg, '', { shadcn: { classification: 'devDependencies', approvedBy: 'someone-else' } })
  assert.equal(issues.length, 1)
  assert.match(issues[0], /not covered by config\/dependency-policy-approvals\.json/)
})

test('a current-head approval still covers a departure from the record', () => {
  assert.deepEqual(checkProtectedDependencies(absentPkg, 'richrothschild', recorded), [])
})

test('the committed record in config/ covers the repository as it stands', () => {
  assert.deepEqual(checkProtectedDependencies(devPkg, ''), [])
})
