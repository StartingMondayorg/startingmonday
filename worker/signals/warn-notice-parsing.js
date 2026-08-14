import * as XLSX from 'xlsx'
import { createHash } from 'node:crypto'

function withTimeout(ms = 12000) {
  return AbortSignal.timeout(ms)
}

function parseCsvRows(text) {
  const lines = String(text ?? '').split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []

  const parseCsvLine = (line) => {
    const out = []
    let cur = ''
    let inQuotes = false
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index]
      if (char === '"') {
        const next = line[index + 1]
        if (inQuotes && next === '"') {
          cur += '"'
          index += 1
          continue
        }
        inQuotes = !inQuotes
        continue
      }
      if (char === ',' && !inQuotes) {
        out.push(cur.trim())
        cur = ''
        continue
      }
      cur += char
    }
    out.push(cur.trim())
    return out
  }

  const headers = parseCsvLine(lines[0]).map((value) => value.trim().toLowerCase())
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    const row = {}
    headers.forEach((header, index) => {
      row[header] = values[index] ?? ''
    })
    return row
  })
}

function parseExcelRows(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const firstSheet = workbook.SheetNames[0]
  if (!firstSheet) return []
  const sheet = workbook.Sheets[firstSheet]
  return XLSX.utils.sheet_to_json(sheet, { defval: '' })
}

function coalesce(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue
    const normalized = String(value).trim()
    if (normalized) return normalized
  }
  return ''
}

function stableNoticeId(stateCode, ...parts) {
  const base = parts
    .map((value) => String(value ?? '').trim().toLowerCase())
    .filter(Boolean)
    .join('|')
  if (!base) return ''
  const digest = createHash('sha1').update(base).digest('hex').slice(0, 16)
  return `${stateCode}-${digest}`
}

function parseDateValue(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') {
    // Excel serial dates count days from 1899-12-30.
    const excelEpochUtc = Date.UTC(1899, 11, 30)
    const millis = excelEpochUtc + Math.round(value * 24 * 60 * 60 * 1000)
    const parsedDate = new Date(millis)
    if (!Number.isFinite(parsedDate.getTime())) return null
    return parsedDate.toISOString().slice(0, 10)
  }
  const text = String(value).trim()
  if (!text) return null
  const parsedDate = new Date(text)
  if (!parsedDate || !Number.isFinite(parsedDate.getTime())) return null
  return parsedDate.toISOString().slice(0, 10)
}

function stripHtml(value) {
  return String(value ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function toWholeNumber(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const text = String(value).trim()
  if (!text) return null

  // Keep thousands separators for a single numeric token, but do not merge
  // separate numbers (e.g. values with dashes/spaces between distinct tokens).
  const firstTokenMatch = text.match(/-?\d[\d,]*/)
  if (!firstTokenMatch) return null

  const cleaned = firstTokenMatch[0].replace(/,/g, '')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function withNormalizedKeys(record) {
  const out = { ...record }
  for (const [key, value] of Object.entries(record ?? {})) {
    const normalizedKey = key
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
    if (normalizedKey && out[normalizedKey] === undefined) {
      out[normalizedKey] = value
    }
  }

  // Common state feed aliases (especially NC/GA downloads)
  out.notice_id = coalesce(
    out.notice_id,
    out.noticeid,
    out.id,
    out.case_number,
    out.case,
    out.warn_number,
    out.ga_warn_id,
    out.entry_id,
    out.warn_id
  )
  out.employer_name = coalesce(
    out.employer_name,
    out.company,
    out.employer,
    out.business_name,
    out.warn_notice_warn_notice_name,
    out.company_name,
    out.location,
    out.employer_business_name
  )
  out.event_date = coalesce(
    out.event_date,
    out.layoff_date,
    out.date,
    out.submitted_date,
    out.warn_received,
    out.warn_notice_received,
    out.first_layoff_date,
    out.notification_date_s,
    out.notice_received_date,
    out.received_date,
    out.date_received,
    out.notice_date
  )
  out.job_losses = coalesce(
    out.job_losses,
    out.affected_workers,
    out.affected,
    out.total_number_of_affected_employees,
    out.cumulative_scheduled_layoff,
    out.employees_affected,
    out.affected_employees,
    out.number_of_employees
  )
  out.source_url = coalesce(out.source_url, out.url, out.notice_url)

  return out
}

function normalizeNotice(record, stateCode) {
  const normalizedRecord = withNormalizedKeys(record)
  const noticeId = String(
    normalizedRecord.notice_id
  ?? normalizedRecord.noticeid
      ?? normalizedRecord.id
      ?? normalizedRecord.case_number
      ?? normalizedRecord.case
      ?? ''
  ).trim()
  const employerName = String(
    normalizedRecord.employer_name
      ?? normalizedRecord.company
      ?? normalizedRecord.employer
      ?? normalizedRecord.business_name
      ?? ''
  ).trim()
  const sourceUrl = String(normalizedRecord.url ?? normalizedRecord.source_url ?? '').trim() || null
  const eventDateRaw = normalizedRecord.event_date ?? normalizedRecord.layoff_date ?? normalizedRecord.date ?? null
  const eventDate = parseDateValue(eventDateRaw)
  const lossesRaw = normalizedRecord.job_losses ?? normalizedRecord.affected_workers ?? normalizedRecord.affected ?? null
  const jobLosses = toWholeNumber(lossesRaw)

  if (!noticeId || !employerName) return null

  return {
    state_code: stateCode,
    notice_id: noticeId,
    employer_name: employerName,
    event_date: eventDate,
    job_losses: Number.isFinite(jobLosses) ? jobLosses : null,
    source_url: sourceUrl,
    raw_payload: normalizedRecord,
  }
}

export {
  withTimeout,
  parseCsvRows,
  parseExcelRows,
  coalesce,
  stableNoticeId,
  parseDateValue,
  stripHtml,
  toWholeNumber,
  withNormalizedKeys,
  normalizeNotice,
}
