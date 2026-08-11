import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFile, readdir } from 'node:fs/promises'
import { buildStandardizedDraft, dedupeOutreachRows, followUpSentByEmail, mapTriggerInputs, prioritizeCuratedRows, readOutreachCsv, type CsvRow, type ClientRow } from './outreach-data'

vi.mock('node:fs/promises', async (importOriginal) => ({
  ...await importOriginal<typeof import('node:fs/promises')>(),
  readFile: vi.fn(),
  readdir: vi.fn(),
}))

const readFileMock = vi.mocked(readFile)
const readdirMock = vi.mocked(readdir)

function fileError(code: string): NodeJS.ErrnoException {
  return Object.assign(new Error(code), { code })
}

describe('outreach-data CSV loading', () => {
  beforeEach(() => {
    readFileMock.mockReset()
    readdirMock.mockReset()
  })

  it('loads and parses CSV data from the source tree', async () => {
    readFileMock.mockResolvedValue('full_name,email\nAda Lovelace,ada@example.com\n')

    await expect(readOutreachCsv('prospects.csv')).resolves.toEqual({
      rowCount: 1,
      rows: [{ full_name: 'Ada Lovelace', email: 'ada@example.com' }],
    })
    expect(readFileMock).toHaveBeenCalledOnce()
    expect(readFileMock.mock.calls[0][0]).toMatch(/docs[\\/]outreach[\\/]prospects\.csv$/)
  })

  it('loads packaged CSV data when the source tree is unavailable', async () => {
    readdirMock.mockResolvedValue([] as any)
    readFileMock
      .mockRejectedValueOnce(fileError('ENOENT'))
      .mockResolvedValueOnce('full_name,email\nGrace Hopper,grace@example.com\n')

    await expect(readOutreachCsv('prospects.csv')).resolves.toMatchObject({ rowCount: 1 })
    expect(readFileMock).toHaveBeenCalledTimes(2)
    expect(readFileMock.mock.calls[1][0]).toMatch(/\.next[\\/]server[\\/]outreach-data[\\/]prospects\.csv$/)
  })

  it('rethrows non-missing-file errors without trying the packaged path', async () => {
    const error = fileError('EACCES')
    readFileMock.mockRejectedValue(error)

    await expect(readOutreachCsv('prospects.csv')).rejects.toBe(error)
    expect(readFileMock).toHaveBeenCalledOnce()
  })

  it('returns an empty source when neither source nor packaged CSV data exists', async () => {
    readdirMock.mockResolvedValue([] as any)
    readFileMock.mockRejectedValue(fileError('ENOENT'))

    await expect(readOutreachCsv('prospects.csv')).resolves.toEqual({ rowCount: 0, rows: [] })
    expect(readFileMock).toHaveBeenCalledTimes(2)
  })

  it('falls back to a suffix-compatible legacy file when provider-prefixed file is missing', async () => {
    const legacyDirent = { name: 'legacy_priority_send_ready.csv', isFile: () => true }
    readdirMock.mockResolvedValue([legacyDirent] as any)
    readFileMock
      .mockRejectedValueOnce(fileError('ENOENT'))
      .mockResolvedValueOnce('full_name,email\nLegacy Person,legacy@example.com\n')

    await expect(readOutreachCsv('provider_priority_send_ready.csv')).resolves.toEqual({
      rowCount: 1,
      rows: [{ full_name: 'Legacy Person', email: 'legacy@example.com' }],
    })

    expect(readdirMock).toHaveBeenCalledTimes(1)
    expect(readFileMock).toHaveBeenCalledTimes(2)
    expect(readFileMock.mock.calls[1][0]).toMatch(/docs[\\/]outreach[\\/]legacy_priority_send_ready\.csv$/)
  })

  it('prioritizes curated rows before the base list', () => {
    const base = { rowCount: 1, rows: [{ email: 'base@example.com' }] }
    const curated = { rowCount: 1, rows: [{ email: 'curated@example.com' }] }

    expect(prioritizeCuratedRows(base, curated, 1).rows).toEqual(curated.rows)
  })
})

describe('outreach-data trigger mapping', () => {
  it('maps CRM and scraping fields into trigger inputs', () => {
    const row: CsvRow = {
      trigger_news: 'board approved a new CIO succession plan',
      linkedin_post: 'your post on reducing interview prep drag',
      personalization_line: 'your profile shows expanded healthcare scope',
    }

    expect(mapTriggerInputs(row)).toEqual({
      newsTrigger: 'board approved a new CIO succession plan',
      postTrigger: 'your post on reducing interview prep drag',
      profileTrigger: 'your profile shows expanded healthcare scope',
    })
  })

  it('falls back across supported aliases per trigger type', () => {
    const row: CsvRow = {
      news_summary: 'new mandate wave after quarter close',
      post_summary: 'you shared a note on shortlist quality',
      notes: 'your cohort now spans two new verticals',
    }

    expect(mapTriggerInputs(row)).toEqual({
      newsTrigger: 'new mandate wave after quarter close',
      postTrigger: 'you shared a note on shortlist quality',
      profileTrigger: 'your cohort now spans two new verticals',
    })
  })

  it('injects mapped triggers into generated templates automatically', () => {
    const row: CsvRow = {
      full_name: 'Maya Patel',
      company: 'Northstar Health',
      role_bucket: 'CIO',
      persona_focus: 'CIO',
      trigger_news: 'CIO succession plan announced after board review',
    }

    const draft = buildStandardizedDraft(row, 'executives')

    expect(draft.subject).toContain('A clearer CIO story for recruiter and board calls')
    expect(draft.body).toContain('I saw CIO leadership changes after board review, and it looked like recruiter and board conversations may be coming fast.')
  })

  it('uses standardized coach template even when source defaults exist', () => {
    const row: CsvRow = {
      full_name: 'Dana Lee',
      company: 'Summit Coaching',
      role_bucket: 'Executive Coach',
      persona_focus: 'Executive Coach',
      post_trigger: 'your post on reducing prep drag between sessions',
      default_subject: 'Legacy CSV subject',
      default_body: 'Legacy CSV body',
    }

    const draft = buildStandardizedDraft(row, 'coaches')

    expect(draft.subject).not.toBe('Legacy CSV subject')
    expect(draft.body).not.toBe('Legacy CSV body')
    expect(draft.body).toContain('I saw your post on reducing prep drag between sessions, and it looked like the kind of prep load coaches end up carrying between sessions.')
    expect(draft.body).toContain('Clients show up prepared, progress stays visible between sessions, and coaching time stays focused on decisions.')
  })
})

describe('outreach-data dedupe', () => {
  function row(input: Partial<ClientRow> & Pick<ClientRow, 'fullName' | 'company' | 'email'>): ClientRow {
    return {
      fullName: input.fullName,
      roleBucket: input.roleBucket ?? 'Executive Coach',
      company: input.company,
      email: input.email,
      emailConfidence: input.emailConfidence ?? 'medium',
      status: input.status ?? 'prospect',
      followUpSent: input.followUpSent ?? false,
      hasLiveOutreach: input.hasLiveOutreach ?? false,
      emailOpening: input.emailOpening ?? '',
      emailBodyCore: input.emailBodyCore ?? '',
      defaultSubject: input.defaultSubject ?? '',
      defaultBody: input.defaultBody ?? '',
      outreachChannel: input.outreachChannel ?? 'coaches',
      fitTier: input.fitTier ?? 'medium',
      personaFocus: input.personaFocus ?? 'Executive transitions',
      campaignTag: input.campaignTag,
    }
  }

  it('dedupes same coach person/company even when emails differ', () => {
    const deduped = dedupeOutreachRows([
      row({
        fullName: 'Dana Lee',
        company: 'Summit Coaching LLC',
        email: 'dana+old@summitcoaching.com',
        fitTier: 'medium',
        emailConfidence: 'medium',
        status: 'prospect',
      }),
      row({
        fullName: 'Dana Lee',
        company: 'Summit Coaching',
        email: 'dana@summitcoaching.com',
        fitTier: 'strong',
        emailConfidence: 'high',
        status: 'reached_out',
      }),
    ])

    expect(deduped).toHaveLength(1)
    expect(deduped[0].email).toBe('dana@summitcoaching.com')
    expect(deduped[0].status).toBe('reached_out')
  })

  it('keeps similarly named people when company differs', () => {
    const deduped = dedupeOutreachRows([
      row({ fullName: 'Jordan Smith', company: 'Northstar Coaching', email: 'jordan@northstar.com' }),
      row({ fullName: 'Jordan Smith', company: 'Lighthouse Coaching', email: 'jordan@lighthouse.com' }),
    ])

    expect(deduped).toHaveLength(2)
  })

  it('flags contacts whose persisted outreach status shows a follow-up already sent', () => {
    const sent = followUpSentByEmail([
      { email: 'alex@example.com', outreach_status: 'followup_1_sent' },
      { email: 'blair@example.com', outreach_status: 'reached_out' },
      { email: 'casey@example.com', outreach_status: 'followup_2_sent' },
    ])

    expect(sent.has('alex@example.com')).toBe(true)
    expect(sent.has('casey@example.com')).toBe(true)
    expect(sent.has('blair@example.com')).toBe(false)
  })
})
