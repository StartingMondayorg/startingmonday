import { describe, expect, it } from 'vitest'
import { CHANNEL_MAPS, type ChannelKey } from './channel-feature-map-data'

const EXPECTED_CHANNELS: ChannelKey[] = ['coaches', 'outplacement', 'executives', 'search_firms']

describe('channel feature-map data integrity', () => {
  it('defines a map for every expected channel', () => {
    for (const key of EXPECTED_CHANNELS) {
      expect(CHANNEL_MAPS[key], `missing channel map: ${key}`).toBeDefined()
    }
    expect(Object.keys(CHANNEL_MAPS).sort()).toEqual([...EXPECTED_CHANNELS].sort())
  })

  it('gives every channel a label, intro, and a valid status', () => {
    for (const [key, map] of Object.entries(CHANNEL_MAPS)) {
      expect(map.label.trim().length, `channel ${key} missing label`).toBeGreaterThan(0)
      expect(map.intro.trim().length, `channel ${key} missing intro`).toBeGreaterThan(0)
      expect(['ready', 'coming_soon'], `channel ${key} invalid status "${map.status}"`).toContain(map.status)
      expect(map.stages.length, `channel ${key} has no stages`).toBeGreaterThan(0)
    }
  })

  it('gives every stage a phase/goal/cadence and non-empty, fully-specified features', () => {
    for (const [key, map] of Object.entries(CHANNEL_MAPS)) {
      for (const stage of map.stages) {
        expect(stage.phase.trim().length, `${key} stage missing phase`).toBeGreaterThan(0)
        expect(stage.goal.trim().length, `${key} stage "${stage.phase}" missing goal`).toBeGreaterThan(0)
        expect(stage.cadence.trim().length, `${key} stage "${stage.phase}" missing cadence`).toBeGreaterThan(0)
        expect(stage.features.length, `${key} stage "${stage.phase}" has no features`).toBeGreaterThan(0)

        for (const feature of stage.features) {
          expect(feature.name.trim().length, `${key}/${stage.phase} feature missing name`).toBeGreaterThan(0)
          expect(feature.benefit.trim().length, `${key}/${stage.phase} feature "${feature.name}" missing benefit`).toBeGreaterThan(0)
          expect(feature.dashboardTag.trim().length, `${key}/${stage.phase} feature "${feature.name}" missing dashboardTag`).toBeGreaterThan(0)
        }
      }
    }
  })
})
