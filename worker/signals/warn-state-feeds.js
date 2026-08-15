import * as XLSX from 'xlsx'
import {
  withTimeout,
  parseCsvRows,
  parseExcelRows,
  coalesce,
  stableNoticeId,
  parseDateValue,
  stripHtml,
  toWholeNumber,
} from './warn-notice-parsing.js'


async function fetchGATableRows(feedUrl) {
  const parsed = new URL(feedUrl)
  const basePayload = new URLSearchParams(parsed.search)
  const endpoint = parsed.origin + parsed.pathname
  const rows = []
  const pageLength = 100
  let draw = 1
  let start = 0
  let totalRecords = Infinity

  while (start < totalRecords && draw <= 40) {
    const payload = new URLSearchParams(basePayload)
    payload.set('draw', String(draw))
    payload.set('start', String(start))
    payload.set('length', String(pageLength))

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'x-requested-with': 'XMLHttpRequest',
      },
      body: payload,
      signal: withTimeout(),
    })

    if (!response.ok) break
    const rawText = await response.text()
    const payloadJson = rawText ? JSON.parse(rawText) : null
    const pageRows = Array.isArray(payloadJson?.data) ? payloadJson.data : []
    const recordsTotal = Number(payloadJson?.recordsTotal ?? payloadJson?.recordsFiltered ?? 0)
    if (Number.isFinite(recordsTotal) && recordsTotal > 0) {
      totalRecords = recordsTotal
    }

    if (!pageRows.length) break
    rows.push(...pageRows)

    if (pageRows.length < pageLength) break
    start += pageRows.length
    draw += 1
  }

  return rows.map((row) => {
    const rowValue = Array.isArray(row) ? row : row && typeof row === 'object' ? row : {}
    const rawIdCell = rowValue[0] ?? rowValue['0'] ?? ''
    const companyCell = rowValue[1] ?? rowValue['1'] ?? ''
    const dateCell = rowValue[2] ?? rowValue['2'] ?? ''
    const lossesCell = rowValue[3] ?? rowValue['3'] ?? ''

    const rawId = stripHtml(rawIdCell)
    const companyName = stripHtml(companyCell)
    const submittedDate = stripHtml(dateCell)
    const affectedEmployees = stripHtml(lossesCell)
    const detailLinkMatch = String(rawIdCell).match(/href=["']([^"']+)["']/i)
    const markerUrl = Array.isArray(rowValue?.gv_marker)
      ? rowValue.gv_marker[0]?.url
      : ''
    const sourceUrl = coalesce(
      detailLinkMatch?.[1] ? new URL(detailLinkMatch[1], 'https://www.tcsg.edu').toString() : '',
      markerUrl
    )
    return {
      notice_id: coalesce(rawId, stableNoticeId('GA', companyName, submittedDate, affectedEmployees, sourceUrl)),
      employer_name: companyName,
      event_date: submittedDate,
      job_losses: toWholeNumber(affectedEmployees),
      source_url: sourceUrl,
    }
  })
}

async function fetchOhioCsvRows(feedUrl) {
  let csvUrl = ''
  const currentYear = new Date().getUTCFullYear()
  const fallbackYears = [currentYear + 1, currentYear, currentYear - 1]
  for (const year of fallbackYears) {
    const candidate = `https://dam.assets.ohio.gov/raw/upload/jfs.ohio.gov/${year}/${year}-warn-notice.csv`
    const candidateResponse = await fetch(candidate, { signal: withTimeout() })
    if (candidateResponse.ok) {
      csvUrl = candidate
      break
    }
  }

  if (!csvUrl) {
    const pageResponse = await fetch(feedUrl, {
      signal: withTimeout(),
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
      },
    })

    if (pageResponse.ok) {
      const html = await pageResponse.text()
      const csvUrlMatch = html.match(/https:\/\/dam\.assets\.ohio\.gov\/raw\/upload\/[^\s"'<>]*warn-notice\.csv/i)
      if (csvUrlMatch?.[0]) {
        csvUrl = csvUrlMatch[0]
      } else {
        const htmlRows = parseOhioRowsFromHtml(html, feedUrl)
        if (htmlRows.length > 0) return htmlRows
      }
    }
  }

  if (!csvUrl) return []

  const csvResponse = await fetch(csvUrl, { signal: withTimeout() })
  if (!csvResponse.ok) return []

  const csvText = await csvResponse.text()
  const csvLines = String(csvText).split(/\r?\n/)
  const headerLineIndex = csvLines.findIndex((line) => /^Company\s*,\s*Date Received\s*,\s*URL\s*,/i.test(line.trim()))
  if (headerLineIndex < 0) return []
  const rows = parseCsvRows(csvLines.slice(headerLineIndex).join('\n'))
  return rows.map((row) => {
    const employer = coalesce(row.company)
    const sourceUrl = coalesce(row.url)
    const eventDate = parseDateValue(row['layoff date(s)'] ?? row['date received'])
    const losses = toWholeNumber(row['potential number affected'])
    const noticeId = stableNoticeId('OH', employer, sourceUrl, row['date received'])
    return {
      notice_id: noticeId,
      employer_name: employer,
      event_date: eventDate,
      job_losses: losses,
      source_url: sourceUrl || null,
      raw_state_record_type: 'oh_warn_csv',
    }
  })
}

function mapIllinoisRows(rows) {
  return rows.map((row) => {
    const employer = coalesce(row['COMPANY NAME:'], row.company_name, row.company)
    const receivedDate = row['WARN RECEIVED DATE:']
    const firstLayoffDate = row['FIRST LAYOFF DATE:']
    const endingLayoffDate = row['ENDING LAYOFF DATE:']
    const workersAffected = row['WORKERS AFFECTED:']
    const cityStateZip = coalesce(row['CITY, STATE, ZIP:'])
    const companyAddress = coalesce(row['COMPANY ADDRESS:'])
    const rawId = stableNoticeId('IL', employer, parseDateValue(receivedDate), parseDateValue(firstLayoffDate), workersAffected, cityStateZip)

    return {
      notice_id: rawId,
      employer_name: employer,
      event_date: parseDateValue(firstLayoffDate) ?? parseDateValue(endingLayoffDate) ?? parseDateValue(receivedDate),
      job_losses: toWholeNumber(workersAffected),
      source_url: null,
      company_address: companyAddress,
      city_state_zip: cityStateZip,
      raw_state_record_type: 'il_warn_xlsx',
    }
  })
}

function mapNewJerseyRows(rows) {
  return rows.map((row) => {
    const employer = coalesce(row.Company, row.company, row.employer_name)
    const effectiveDate = row['Effective Date']
    const workforceAffected = row['Workforce Affected']
    const city = coalesce(row.City, row.city)
    const monthPosted = coalesce(row['Month Posted'], row.month_posted)
    const rawId = stableNoticeId('NJ', employer, parseDateValue(effectiveDate), workforceAffected, city, monthPosted)

    return {
      notice_id: rawId,
      employer_name: employer,
      event_date: parseDateValue(effectiveDate),
      job_losses: toWholeNumber(workforceAffected),
      source_url: null,
      city,
      month_posted: monthPosted,
      raw_state_record_type: 'nj_warn_xlsx',
    }
  })
}

function parseOhioRowsFromHtml(html, feedUrl) {
  const text = String(html ?? '')
  const rows = []
  const rowMatches = text.match(/<tr[\s\S]*?<\/tr>/gi) ?? []

  for (const rawRow of rowMatches) {
    if (!/dam\.assets\.ohio\.gov/i.test(rawRow)) continue

    const cellHtml = [...rawRow.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((match) => match[1] ?? '')
    const cells = cellHtml.map((value) => stripHtml(value))
    const hrefMatch = rawRow.match(/href=["']([^"']*dam\.assets\.ohio\.gov[^"']+)["']/i)
    if (!hrefMatch) continue
    const sourceUrl = hrefMatch[1].startsWith('http') ? hrefMatch[1] : new URL(hrefMatch[1], feedUrl).toString()

    const employer = coalesce(cells[0], cells[1])
    const possibleDate = cells.find((value) => /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/.test(value))
    const possibleLosses = cells.find((value) => /\d{1,3}(,\d{3})*$/.test(value))
    const noticeId = stableNoticeId('OH', employer, sourceUrl, possibleDate)

    rows.push({
      notice_id: noticeId,
      employer_name: employer,
      event_date: parseDateValue(possibleDate),
      job_losses: toWholeNumber(possibleLosses),
      source_url: sourceUrl,
      raw_state_record_type: 'oh_warn_html',
    })
  }

  return rows
}


async function fetchCADataRows(feedUrl) {
  // California EDD publishes WARN data as XLSX file with complex headers
  try {
    const response = await fetch(feedUrl, { signal: withTimeout() })
    if (!response.ok) return []

    const contentType = (response.headers.get('content-type') ?? '').toLowerCase()
    
    // Handle XLSX
    if (contentType.includes('spreadsheet') || contentType.includes('excel') || feedUrl.includes('.xlsx')) {
      const bytes = Buffer.from(await response.arrayBuffer())
      const workbook = XLSX.read(bytes, { type: 'buffer' })
      
      // CA XLSX has multiple sheets - use "Detailed WARN Report"
      const targetSheet = workbook.SheetNames.find((name) =>
        String(name).toLowerCase().includes('detailed')
      ) || workbook.SheetNames[2]
      
      if (!targetSheet) return []
      const sheet = workbook.Sheets[targetSheet]
      
      // Parse cells directly to handle complex headers
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:I1600')
      const rows = []
      
      // Start from row 3 (skip description headers at rows 1-2)
      for (let row = 3; row <= range.e.r; row++) {
        const company = sheet[XLSX.utils.encode_cell({ r: row, c: 4 })]?.v
        if (!company) continue
        
        rows.push({
          county: sheet[XLSX.utils.encode_cell({ r: row, c: 0 })]?.v || '',
          notice_date: sheet[XLSX.utils.encode_cell({ r: row, c: 1 })]?.v,
          processed_date: sheet[XLSX.utils.encode_cell({ r: row, c: 2 })]?.v,
          effective_date: sheet[XLSX.utils.encode_cell({ r: row, c: 3 })]?.v,
          company: company,
          layoff_closure: sheet[XLSX.utils.encode_cell({ r: row, c: 5 })]?.v || '',
          employees: sheet[XLSX.utils.encode_cell({ r: row, c: 6 })]?.v || 0,
          address: sheet[XLSX.utils.encode_cell({ r: row, c: 7 })]?.v || '',
          industry: sheet[XLSX.utils.encode_cell({ r: row, c: 8 })]?.v || '',
        })
      }
      
      return rows
    }

    // Handle JSON
    if (contentType.includes('json')) {
      const data = await response.json()
      if (data?.result?.records) return data.result.records
      if (Array.isArray(data)) return data
      if (data?.data) return Array.isArray(data.data) ? data.data : []
    }

    // Try CSV as fallback
    const text = await response.text()
    return parseCsvRows(text)
  } catch {
    return []
  }
}

function mapCaliforniaRows(rows) {
  return rows
    .map((row) => {
      const employer = String(row.company || row.employer_name || row['Company Name'] || '').trim()
      const eventDate = parseDateValue(
        row.notice_date || row.processed_date || row.date_received || row['Date Received'] || ''
      )
      
      if (!employer || !eventDate) return null
      
      const noticeId = stableNoticeId('CA', employer, eventDate)
      const jobLosses = toWholeNumber(row.employees || row.job_losses || row['No. Of Employees'] || '')

      return {
        notice_id: noticeId,
        employer_name: employer,
        event_date: eventDate,
        job_losses: jobLosses,
        location: row.county || row.address || null,
      }
    })
    .filter(Boolean)
}

async function fetchTXDataRows(feedUrl) {
  // Texas Workforce Commission publishes WARN data via their public portal
  try {
    const response = await fetch(feedUrl, { signal: withTimeout() })
    if (!response.ok) return []

    const contentType = (response.headers.get('content-type') ?? '').toLowerCase()
    if (contentType.includes('json')) {
      const data = await response.json()
      return Array.isArray(data) ? data : data?.records || data?.data || []
    }

    if (contentType.includes('spreadsheet') || contentType.includes('excel')) {
      const bytes = Buffer.from(await response.arrayBuffer())
      return parseExcelRows(bytes)
    }

    const text = await response.text()
    return parseCsvRows(text)
  } catch {
    return []
  }
}

function mapTexasRows(rows) {
  return rows
    .map((row) => {
      // TX XLSX columns: NOTICE_DATE, JOB_SITE_NAME, COUNTY_NAME, WDA_NAME, TOTAL_LAYOFF_NUMBER, LayOff_Date, WFDD_RECEIVED_DATE, CITY_NAME
      const employer = String(row.JOB_SITE_NAME || row.company_name || row.employer || '').trim()
      const noticeDate = row.NOTICE_DATE || row.WFDD_RECEIVED_DATE || row.notice_date || row.received_date
      const eventDate = parseDateValue(noticeDate)
      
      if (!employer || !eventDate) return null
      
      const noticeId = stableNoticeId('TX', employer, eventDate)
      const jobLosses = toWholeNumber(row.TOTAL_LAYOFF_NUMBER || row.workers_affected || row.job_losses || '')

      return {
        notice_id: noticeId,
        employer_name: employer,
        event_date: eventDate,
        job_losses: jobLosses,
        location: String(row.CITY_NAME || row.COUNTY_NAME || row.city || '').trim() || null,
      }
    })
    .filter(Boolean)
}

async function fetchFLDataRows(feedUrl) {
  // Florida USES publishes WARN data via their reporting system
  try {
    const response = await fetch(feedUrl, { signal: withTimeout() })
    if (!response.ok) return []

    const contentType = (response.headers.get('content-type') ?? '').toLowerCase()
    if (contentType.includes('json')) {
      const data = await response.json()
      return Array.isArray(data) ? data : data?.records || data?.notifications || []
    }

    if (contentType.includes('spreadsheet') || contentType.includes('excel')) {
      const bytes = Buffer.from(await response.arrayBuffer())
      return parseExcelRows(bytes)
    }

    const text = await response.text()
    return parseCsvRows(text)
  } catch {
    return []
  }
}

function mapFloridaRows(rows) {
  return rows
    .map((row) => {
      const noticeId = stableNoticeId(
        'FL',
        String(row.employer_name || row.company || row.business_name || '').trim(),
        parseDateValue(row.received_date || row.notice_date || row.date_received || '')
      )

      return {
        notice_id: noticeId,
        employer_name: String(row.employer_name || row.company || row.business_name || '').trim(),
        event_date: parseDateValue(row.received_date || row.notice_date || row.date_received || ''),
        job_losses: toWholeNumber(row.affected_workers || row.job_losses || row.workers || ''),
        location: String(row.county || row.city || '').trim() || null,
      }
    })
    .filter((row) => row.employer_name && row.event_date)
}

async function fetchNYDataRows(feedUrl) {
  // New York Department of Labor publishes WARN data via their public database
  try {
    const response = await fetch(feedUrl, { 
      signal: withTimeout(),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    if (!response.ok) return []

    const contentType = (response.headers.get('content-type') ?? '').toLowerCase()
    if (contentType.includes('json')) {
      const data = await response.json()
      return Array.isArray(data) ? data : data?.records || data?.rows || data?.data || []
    }

    if (contentType.includes('spreadsheet') || contentType.includes('excel')) {
      const bytes = Buffer.from(await response.arrayBuffer())
      return parseExcelRows(bytes)
    }

    const text = await response.text()
    
    // Try to parse as CSV first (for direct exports)
    const csvRows = parseCsvRows(text)
    if (csvRows.length > 0) {
      return csvRows
    }
    
    // If HTML, parse table rows
    const htmlRows = parseNYHtmlRows(text)
    if (htmlRows.length > 0) {
      return htmlRows
    }
    
    return []
  } catch {
    return []
  }
}

function parseNYHtmlRows(html) {
  const rows = []
  
  // Look for table rows in the HTML
  const tableMatches = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || []
  
  if (tableMatches.length === 0) return rows
  
  for (const rowHtml of tableMatches) {
    // Extract cells from row
    const cellMatches = rowHtml.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || []
    if (cellMatches.length === 0) continue
    
    // Clean cell content
    const cells = cellMatches.map(cell => {
      const content = cell
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        // Decode &amp; last so earlier replacements cannot double-unescape
        // sequences like &amp;lt; into live markup characters.
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim()
      return content
    }).filter(Boolean)
    
    if (cells.length < 3) continue // Skip rows with too few cells
    
    // Try to extract employer name (usually first or second column)
    // WARN data typically has: Employer | Date | Location | Affected
    let employer = ''
    let dateStr = ''
    let affected = ''
    
    // Simple heuristic: look for date patterns
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i]
      // Check if looks like a date
      if (/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(cell)) {
        dateStr = cell
        // Employer is usually before date
        if (i > 0 && !employer) {
          employer = cells[i - 1]
        }
      }
      // Check if looks like a number (affected workers)
      if (/^\d{1,5}(\s|,|$)/.test(cell) && !affected && cell.length < 10) {
        affected = cell
      }
    }
    
    // Fallback: use first cell as employer if not found
    if (!employer) {
      employer = cells[0]
    }
    
    if (!employer || !dateStr) continue
    
    rows.push({
      employer_name: employer,
      event_date: dateStr,
      job_losses: affected || null,
      location: cells.length > 3 ? cells[2] : null,
    })
  }
  
  return rows
}

function mapNewYorkRows(rows) {
  return rows
    .map((row) => {
      const noticeId = stableNoticeId(
        'NY',
        String(row.employer || row.company_name || row.business_name || '').trim(),
        parseDateValue(row.date_received || row.effective_date || row.notice_date || '')
      )

      return {
        notice_id: noticeId,
        employer_name: String(row.employer || row.company_name || row.business_name || '').trim(),
        event_date: parseDateValue(row.date_received || row.effective_date || row.notice_date || ''),
        job_losses: toWholeNumber(row.number_of_employees || row.job_losses || row.affected || ''),
        location: String(row.county || row.city || '').trim() || null,
      }
    })
    .filter((row) => row.employer_name && row.event_date)
}

async function fetchPADataRows(feedUrl) {
  // Pennsylvania Department of Labor publishes WARN data via their bureau
  try {
    const response = await fetch(feedUrl, { signal: withTimeout() })
    if (!response.ok) return []

    const contentType = (response.headers.get('content-type') ?? '').toLowerCase()
    if (contentType.includes('json')) {
      const data = await response.json()
      return Array.isArray(data) ? data : data?.records || data?.notices || data?.data || []
    }

    if (contentType.includes('spreadsheet') || contentType.includes('excel')) {
      const bytes = Buffer.from(await response.arrayBuffer())
      return parseExcelRows(bytes)
    }

    const text = await response.text()
    return parseCsvRows(text)
  } catch {
    return []
  }
}

function mapPennsylvaniaRows(rows) {
  return rows
    .map((row) => {
      const noticeId = stableNoticeId(
        'PA',
        String(row.company_name || row.employer || row.business_name || '').trim(),
        parseDateValue(row.notice_received || row.received_date || row.date || '')
      )

      return {
        notice_id: noticeId,
        employer_name: String(row.company_name || row.employer || row.business_name || '').trim(),
        event_date: parseDateValue(row.notice_received || row.received_date || row.date || ''),
        job_losses: toWholeNumber(row.number_affected || row.job_losses || row.affected_workers || ''),
        location: String(row.county || row.municipality || '').trim() || null,
      }
    })
    .filter((row) => row.employer_name && row.event_date)
}

async function fetchMIDataRows(feedUrl) {
  // Michigan Department of Labor publishes WARN data via their workforce system
  try {
    const response = await fetch(feedUrl, { signal: withTimeout() })
    if (!response.ok) return []

    const contentType = (response.headers.get('content-type') ?? '').toLowerCase()
    if (contentType.includes('json')) {
      const data = await response.json()
      return Array.isArray(data) ? data : data?.records || data?.notices || data?.items || []
    }

    if (contentType.includes('spreadsheet') || contentType.includes('excel')) {
      const bytes = Buffer.from(await response.arrayBuffer())
      return parseExcelRows(bytes)
    }

    const text = await response.text()
    return parseCsvRows(text)
  } catch {
    return []
  }
}

function mapMichiganRows(rows) {
  return rows
    .map((row) => {
      const noticeId = stableNoticeId(
        'MI',
        String(row.employer_name || row.company || row.business_name || '').trim(),
        parseDateValue(row.date_received || row.notice_date || row.received_date || '')
      )

      return {
        notice_id: noticeId,
        employer_name: String(row.employer_name || row.company || row.business_name || '').trim(),
        event_date: parseDateValue(row.date_received || row.notice_date || row.received_date || ''),
        job_losses: toWholeNumber(row.workers_affected || row.job_losses || row.affected || ''),
        location: String(row.county || row.city || '').trim() || null,
      }
    })
    .filter((row) => row.employer_name && row.event_date)
}


export {
  fetchGATableRows,
  fetchOhioCsvRows,
  mapIllinoisRows,
  mapNewJerseyRows,
  parseOhioRowsFromHtml,
  fetchCADataRows,
  mapCaliforniaRows,
  fetchTXDataRows,
  mapTexasRows,
  fetchFLDataRows,
  mapFloridaRows,
  fetchNYDataRows,
  parseNYHtmlRows,
  mapNewYorkRows,
  fetchPADataRows,
  mapPennsylvaniaRows,
  fetchMIDataRows,
  mapMichiganRows,
}
