import { vi } from 'vitest'

// Minimal in-memory stand-in for the supabase-js query builder used by the
// briefing job. Only eq/in filters are applied; other modifiers are accepted
// and ignored. `failures` injects an error for a given `${table}:${op}`.
export function createFakeSupabase({ tables = {}, uniqueKeys = {}, failures = {}, missingTables = [] } = {}) {
  const db = Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, rows.map(r => ({ ...r }))]))
  const calls = []

  function matches(row, filters) {
    return filters.every(([kind, column, value]) => {
      if (kind === 'eq') return row[column] === value
      if (kind === 'in') return value.includes(row[column])
      return true
    })
  }

  function execute(state) {
    calls.push(state)
    const { table, op } = state
    if (missingTables.includes(table)) {
      return { data: null, error: { code: 'PGRST205', message: `Could not find the table 'public.${table}'` } }
    }
    const failure = failures[`${table}:${op}`]
    if (failure) {
      const error = typeof failure === 'function' ? failure(state) : failure
      if (error) return { data: null, error }
    }
    const rows = db[table] ?? (db[table] = [])

    if (op === 'insert') {
      const payloads = Array.isArray(state.payload) ? state.payload : [state.payload]
      const key = uniqueKeys[table]
      for (const payload of payloads) {
        if (key && rows.some(r => key.every(k => r[k] === payload[k]))) {
          return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } }
        }
      }
      rows.push(...payloads.map(p => ({ ...p })))
      return { data: null, error: null }
    }

    if (op === 'update') {
      const hit = rows.filter(r => matches(r, state.filters))
      for (const row of hit) Object.assign(row, state.payload)
      return { data: state.returning ? hit.map(r => ({ ...r })) : null, error: null }
    }

    const hit = rows.filter(r => matches(r, state.filters)).map(r => ({ ...r }))
    if (state.single) return { data: hit[0] ?? null, error: null }
    return { data: hit, error: null }
  }

  function from(table) {
    const state = { table, op: 'select', filters: [], payload: null, returning: false, single: false }
    const query = {
      select() { if (state.op !== 'select') state.returning = true; return query },
      insert(payload) { state.op = 'insert'; state.payload = payload; return query },
      update(payload) { state.op = 'update'; state.payload = payload; return query },
      eq(column, value) { state.filters.push(['eq', column, value]); return query },
      in(column, values) { state.filters.push(['in', column, values]); return query },
      gt() { return query },
      gte() { return query },
      lt() { return query },
      not() { return query },
      order() { return query },
      limit() { return query },
      single() { state.single = true; return query },
      maybeSingle() { state.single = true; return query },
      then(resolve, reject) { return Promise.resolve().then(() => execute(state)).then(resolve, reject) },
    }
    return query
  }

  return {
    db,
    calls,
    from: vi.fn(from),
    rpc: vi.fn(async name => ({ data: name === 'try_advisory_lock' ? true : null, error: null })),
  }
}
