import fs from 'node:fs'
import path from 'node:path'

const apiRoot = path.join(process.cwd(), 'src', 'app', 'api')

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walk(fullPath))
      continue
    }
    if (entry.isFile() && entry.name === 'route.ts') files.push(fullPath)
  }
  return files
}

function normalize(p) {
  return p.split(path.sep).join('/')
}

function main() {
  const approvedGuards = [
    /requireAuth\(/,
    /requireFeatureAccess\(/,
    /requireStaffAutomationAccess\(/,
    /requireAutomationAccess\(/,
    /requirePublicAuthRoute\(/,
    /enforcePublicEndpointGuard\(/,
    /validateCronRequest\(/,
    /\.auth\.getUser\(/,
    /require[A-Za-z]*(Auth|Access|Guard)\(/,
  ]

  const files = walk(apiRoot)
    .map(normalize)
    .filter((p) => !p.includes('/webhooks/'))

  const publicRouteExemptions = [
    '/src/app/api/track/open/route.ts',
    '/src/app/api/(outreach)/drip/unsubscribe/route.ts',
    '/src/app/api/ideas/route.ts',
  ]

  let fail = false

  for (const file of files) {
    if (publicRouteExemptions.some((suffix) => file.endsWith(suffix))) continue

    const text = fs.readFileSync(file, 'utf8')
    const hasMutation = /\.(insert|update|upsert|delete)\(/.test(text)
    if (!hasMutation) continue

    if (!approvedGuards.some((guard) => guard.test(text))) {
      console.error(`MISSING auth guard: ${file}`)
      fail = true
    }
  }

  if (fail) {
    console.error('')
    console.error('All /api routes outside webhooks/ must import and call an approved auth guard.')
    process.exitCode = 1
    return
  }

  console.log('All API routes have requireAuth.')
}

main()
