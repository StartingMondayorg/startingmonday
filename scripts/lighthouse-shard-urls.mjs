#!/usr/bin/env node
// Writes a shard-specific Lighthouse config containing this shard's slice of URLs.
//
// The .lighthouserc*.json files stay the single source of truth for which routes
// are audited, so `npm run perf:lighthouse:budget:config` keeps validating them.
// Each shard takes a round-robin slice and writes a derived config; passing a
// config file rather than repeated --collect.url flags keeps the run step free of
// shell word-splitting, which behaves differently across shells.
import fs from 'node:fs'
import path from 'node:path'

const configPath = process.env.LHCI_CONFIG
const index = Number(process.env.SHARD_INDEX) - 1
const total = Number(process.env.SHARD_TOTAL)
const outDir = process.env.RUNNER_TEMP || process.cwd()

if (!configPath) {
  console.error('LHCI_CONFIG is not set')
  process.exit(1)
}

if (!Number.isInteger(index) || index < 0 || !Number.isInteger(total) || total < 1 || index >= total) {
  console.error(`Invalid shard: SHARD_INDEX=${process.env.SHARD_INDEX} SHARD_TOTAL=${process.env.SHARD_TOTAL}`)
  process.exit(1)
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
const urls = config?.ci?.collect?.url ?? []

if (urls.length < total) {
  console.error(`${urls.length} URL(s) in ${configPath} cannot fill ${total} shards; reduce the shard count.`)
  process.exit(1)
}

const mine = urls.filter((_, i) => i % total === index)
config.ci.collect.url = mine

const shardConfigPath = path.join(outDir, `lighthouserc.shard-${index + 1}.json`)
fs.writeFileSync(shardConfigPath, JSON.stringify(config, null, 2))

console.log(`Shard ${index + 1}/${total} auditing ${mine.length} of ${urls.length} URLs:`)
for (const url of mine) console.log(`  ${url}`)
console.log(`Wrote ${shardConfigPath}`)

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `config=${shardConfigPath}\n` + `list=${mine.join(' ')}\n`
  )
}
