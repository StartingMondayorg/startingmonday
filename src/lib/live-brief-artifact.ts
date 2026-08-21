import { createHash } from 'node:crypto'

export const LIVE_BRIEF_ARTIFACT_MAX_BYTES = 512_000

export function serializeLiveBriefArtifact(payload: Record<string, unknown>): string {
  return JSON.stringify(payload)
}

export function hashLiveBriefArtifact(payload: Record<string, unknown>): string {
  return createHash('sha256')
    .update(serializeLiveBriefArtifact(payload), 'utf8')
    .digest('hex')
}