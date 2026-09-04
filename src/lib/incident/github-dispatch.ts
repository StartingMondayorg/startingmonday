import { createSign } from 'crypto'

// Mints a short-lived GitHub App installation token and fires a
// repository_dispatch. A PAT would work here too, but it would be a standing,
// human-attributed credential sitting in the environment of a public repo's web
// app; an installation token is minted per request, lives ~60 seconds in memory
// and is never persisted.
//
// repository_dispatch requires contents:write, which is broader than we would
// like. That is the reason this module does exactly one thing and the app never
// holds the token beyond the call.

const GITHUB_API = 'https://api.github.com'

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url')
}

export function buildAppJwt(appId: string, privateKey: string, nowSeconds = Math.floor(Date.now() / 1000)): string {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  // GitHub rejects a future iat, so back-date by a minute to absorb clock skew.
  const payload = base64url(
    JSON.stringify({ iat: nowSeconds - 60, exp: nowSeconds + 540, iss: appId }),
  )
  const data = `${header}.${payload}`
  const signature = createSign('RSA-SHA256').update(data).sign(normalizeKey(privateKey))
  return `${data}.${base64url(signature)}`
}

/** Secret stores frequently flatten the PEM's newlines into literal "\n". */
export function normalizeKey(privateKey: string): string {
  return privateKey.includes('\\n') ? privateKey.replace(/\\n/g, '\n') : privateKey
}

async function githubJson(url: string, token: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  if (!response.ok) {
    throw new Error(`github ${init.method ?? 'GET'} ${url} -> ${response.status} ${await response.text()}`)
  }
  return response.status === 204 ? null : response.json()
}

export async function dispatchIncident(options: {
  owner: string
  repo: string
  appId: string
  privateKey: string
  fingerprint: string
  alertClass: string
  mode: string
}): Promise<void> {
  const jwt = buildAppJwt(options.appId, options.privateKey)
  const installation = await githubJson(
    `${GITHUB_API}/repos/${options.owner}/${options.repo}/installation`,
    jwt,
  )
  const auth = await githubJson(
    `${GITHUB_API}/app/installations/${(installation as { id: number }).id}/access_tokens`,
    jwt,
    { method: 'POST' },
  )

  await githubJson(`${GITHUB_API}/repos/${options.owner}/${options.repo}/dispatches`, (auth as { token: string }).token, {
    method: 'POST',
    body: JSON.stringify({
      event_type: 'prod-alert',
      // Only the fingerprint travels. The responder reads the evidence from
      // Supabase, so alert text never passes through a workflow input where it
      // could be interpolated into a shell command.
      client_payload: {
        fingerprint: options.fingerprint,
        alert_class: options.alertClass,
        mode: options.mode,
      },
    }),
  })
}
