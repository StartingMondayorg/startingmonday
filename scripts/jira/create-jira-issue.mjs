#!/usr/bin/env node
// Create a Jira issue.
//
// Positional (original interface, still supported):
//   node scripts/jira/create-jira-issue.mjs "Summary" "Description" "IssueType"
//
// Flags (added for the incident loop, which needs multi-paragraph bodies,
// labels, and a machine-readable result):
//   --summary "..."            required in flag mode
//   --description-file PATH    body text; blank lines separate ADF paragraphs
//   --description "..."        single-paragraph body
//   --labels a,b,c
//   --issue-type Bug           default: Task
//   --json                     print {key,url} instead of prose

import { readFileSync } from 'node:fs'

const argv = process.argv.slice(2)
const useFlags = argv.some(a => a.startsWith('--'))

const flag = (name) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? undefined : argv[i + 1]
}
const has = (name) => argv.includes(`--${name}`)

let summary, descriptionText, issueType, labels, asJson

if (useFlags) {
  summary = flag('summary')
  descriptionText = flag('description-file')
    ? readFileSync(flag('description-file'), 'utf8')
    : (flag('description') ?? '')
  issueType = flag('issue-type') ?? 'Task'
  labels = (flag('labels') ?? '').split(',').map(s => s.trim()).filter(Boolean)
  asJson = has('json')
} else {
  ;[summary, descriptionText = '', issueType = 'Task'] = argv
  labels = []
  asJson = false
}

if (!summary) {
  console.error('Usage: create-jira-issue.mjs "Summary" "Description" "IssueType"')
  console.error('   or: create-jira-issue.mjs --summary "..." [--description-file PATH] [--labels a,b] [--issue-type Bug] [--json]')
  process.exit(1)
}

const baseUrl = process.env.JIRA_BASE_URL
const email = process.env.JIRA_EMAIL
const apiToken = process.env.JIRA_API_TOKEN
const projectKey = process.env.JIRA_PROJECT_KEY

if (!baseUrl || !email || !apiToken || !projectKey) {
  console.error('Missing required env vars: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY')
  process.exit(1)
}

// Atlassian Document Format. Blank lines separate paragraphs; a single newline
// inside a paragraph becomes a hard break, so evidence blocks keep their shape.
function toAdf(text) {
  const blocks = text.split(/\n{2,}/).map(b => b.trim()).filter(Boolean)
  if (blocks.length === 0) blocks.push('No description provided.')

  return {
    type: 'doc',
    version: 1,
    content: blocks.map(block => {
      const lines = block.split('\n')
      const content = []
      lines.forEach((line, i) => {
        if (i > 0) content.push({ type: 'hardBreak' })
        if (line) content.push({ type: 'text', text: line })
      })
      return { type: 'paragraph', content: content.length ? content : [{ type: 'text', text: ' ' }] }
    }),
  }
}

const auth = Buffer.from(`${email}:${apiToken}`).toString('base64')

const body = {
  fields: {
    project: { key: projectKey },
    summary,
    description: toAdf(descriptionText),
    issuetype: { name: issueType },
    ...(labels.length ? { labels } : {}),
  },
}

const response = await fetch(`${baseUrl}/rest/api/3/issue`, {
  method: 'POST',
  headers: {
    Authorization: `Basic ${auth}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
})

const text = await response.text()

if (!response.ok) {
  console.error(`Jira create failed: ${response.status}`)
  console.error(text)
  process.exit(1)
}

let data
try {
  data = JSON.parse(text)
} catch {
  console.log(text)
  process.exit(0)
}

if (asJson) {
  console.log(JSON.stringify({ key: data.key, url: `${baseUrl}/browse/${data.key}` }))
} else {
  console.log(`Created issue: ${data.key}`)
  console.log(`${baseUrl}/browse/${data.key}`)
}
