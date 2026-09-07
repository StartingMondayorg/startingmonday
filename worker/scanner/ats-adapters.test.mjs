// Run: node --test worker/scanner/ats-adapters.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { detectAts, jobsToText } from './ats-adapters.js'

test('detectAts recognizes Greenhouse boards (path token and ?for= embed)', () => {
  const a = detectAts('https://job-boards.greenhouse.io/3cloud/jobs/8573449002')
  assert.equal(a?.name, 'greenhouse')
  assert.ok(a.endpoint.includes('/v1/boards/3cloud/jobs'))

  const embed = detectAts('https://boards.greenhouse.io/embed/job_board?for=acme')
  assert.equal(embed?.name, 'greenhouse')
  assert.ok(embed.endpoint.includes('/v1/boards/acme/jobs'))
})

test('detectAts recognizes Lever / SmartRecruiters / BambooHR', () => {
  assert.equal(detectAts('https://jobs.lever.co/navisite')?.name, 'lever')
  assert.ok(detectAts('https://jobs.lever.co/navisite').endpoint.includes('/v0/postings/navisite'))

  const sr = detectAts('https://careers.smartrecruiters.com/MastechDigital')
  assert.equal(sr?.name, 'smartrecruiters')
  assert.ok(sr.endpoint.includes('/companies/MastechDigital/postings'))

  const bb = detectAts('https://mylogically.bamboohr.com/careers')
  assert.equal(bb?.name, 'bamboohr')
  assert.equal(bb.endpoint, 'https://mylogically.bamboohr.com/careers/list')
})

test('detectAts recognizes Ashby boards (SMK-486)', () => {
  const a = detectAts('https://jobs.ashbyhq.com/linear')
  assert.equal(a?.name, 'ashby')
  assert.equal(a.endpoint, 'https://api.ashbyhq.com/posting-api/job-board/linear')
  assert.deepEqual(
    a.adapter.parse({ jobs: [{ title: 'Head of Engineering', location: 'Remote', jobUrl: 'https://x/1' }] }),
    [{ title: 'Head of Engineering', location: 'Remote', url: 'https://x/1' }],
  )
  assert.equal(detectAts('https://notashbyhq.com/acme'), null)
})

test('detectAts recognizes Workday and builds the CXS POST endpoint', () => {
  const wd = detectAts('https://evolent.wd1.myworkdayjobs.com/External')
  assert.equal(wd?.name, 'workday')
  assert.equal(wd.endpoint, 'https://evolent.wd1.myworkdayjobs.com/wday/cxs/evolent/External/jobs')
  assert.equal(wd.request.method, 'POST')
  // a leading locale segment (en-US) is skipped when resolving the site
  const wd2 = detectAts('https://acme.wd5.myworkdayjobs.com/en-US/Careers')
  assert.ok(wd2.endpoint.endsWith('/wday/cxs/acme/Careers/jobs'))
})

test('detectAts returns null for unknown/non-ATS hosts', () => {
  assert.equal(detectAts('https://www.example.com/careers'), null)
  assert.equal(detectAts('https://recruiting.ultipro.com/x/JobBoard/y'), null) // not yet supported
  assert.equal(detectAts('https://workforcenow.adp.com/mascsr/default/mdf/recruitment/recruitment.html'), null) // ADP has no clean public JSON feed
  assert.equal(detectAts('garbage'), null)
})

test('adapters parse their native response shape into { title, location, url }', () => {
  const gh = detectAts('https://boards.greenhouse.io/acme').adapter
  assert.deepEqual(
    gh.parse({ jobs: [{ title: 'VP Service Delivery', location: { name: 'Remote' }, absolute_url: 'https://x/1' }] }),
    [{ title: 'VP Service Delivery', location: 'Remote', url: 'https://x/1' }],
  )

  const lever = detectAts('https://jobs.lever.co/acme').adapter
  assert.deepEqual(
    lever.parse([{ text: 'COO', categories: { location: 'NYC' }, hostedUrl: 'https://x/2' }]),
    [{ title: 'COO', location: 'NYC', url: 'https://x/2' }],
  )

  const sr = detectAts('https://careers.smartrecruiters.com/Acme').adapter
  assert.deepEqual(
    sr.parse({ content: [{ name: 'Head of Managed Services', location: { city: 'Austin', region: 'TX', country: 'US' } }] }),
    [{ title: 'Head of Managed Services', location: 'Austin, TX, US', url: null }],
  )

  const bb = detectAts('https://sub.bamboohr.com/careers').adapter
  const parsed = bb.parse({ result: [{ jobOpeningName: 'Managed Services Engineer', location: { city: 'Charleston', state: 'SC' } }] })
  assert.equal(parsed[0].title, 'Managed Services Engineer')
  assert.equal(parsed[0].location, 'Charleston, SC')

  const wday = detectAts('https://acme.wd1.myworkdayjobs.com/External').adapter
  assert.deepEqual(
    wday.parse({ jobPostings: [{ title: 'VP Service Delivery', locationsText: 'Remote US', externalPath: '/job/123' }] }),
    [{ title: 'VP Service Delivery', location: 'Remote US', url: '/job/123' }],
  )
})

test('jobsToText renders title + location per line for detectRoles', () => {
  const text = jobsToText([
    { title: 'VP Service Delivery', location: 'Remote' },
    { title: 'COO', location: null },
  ])
  assert.equal(text, 'VP Service Delivery — Remote\nCOO')
})
