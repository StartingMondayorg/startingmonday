import { describe, expect, it } from 'vitest'
import type { Database, Json } from './supabase/database.types'

describe('database types', () => {
  it('exposes the public table contract and JSON value type', () => {
    const company: Database['public']['Tables']['companies']['Row'] = {} as never
    const json: Json = { enabled: true, count: 1 }
    expect(company).toBeDefined()
    expect(json).toEqual({ enabled: true, count: 1 })
  })
})
