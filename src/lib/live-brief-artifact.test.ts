import { describe, expect, it } from 'vitest'
import { hashLiveBriefArtifact, LIVE_BRIEF_ARTIFACT_MAX_BYTES, serializeLiveBriefArtifact } from './live-brief-artifact'

describe('live brief artifact hashing', () => {
  it('serializes and hashes the reviewed payload as a SHA-256 digest', () => {
    const payload = { title: 'Executive positioning', sections: ['proof'] }
    expect(serializeLiveBriefArtifact(payload)).toBe(JSON.stringify(payload))
    expect(hashLiveBriefArtifact(payload)).toMatch(/^[a-f0-9]{64}$/)
  })

  it('exposes the private artifact size limit', () => {
    expect(LIVE_BRIEF_ARTIFACT_MAX_BYTES).toBe(512_000)
  })
})