/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getVerifiedSourceCatalog } from '@/lib/executive-research-library'

export const runtime = 'nodejs'

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function stripHtml(html: string): string {
  return normalizeWhitespace(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style\b[^>]*>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      // Keep entities encoded to avoid unsafe double-unescape behavior.
      .replace(/&(nbsp|#160);/gi, ' ')
  )
}

function extractMatch(pattern: RegExp, html: string): string | null {
  const match = html.match(pattern)
  return match?.[1] ? normalizeWhitespace(match[1]) : null
}

function buildExcerpt(html: string): string {
  const text = stripHtml(html)
  return text.slice(0, 900)
}

async function fetchSourceSnapshot(url: string): Promise<{ status: number | null; title: string | null; summary: string; excerpt: string; error: string | null }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'StartingMondayResearchBot/1.0 (+https://startingmonday.app)',
        accept: 'text/html,application/xhtml+xml',
      },
    })
    const html = await response.text()
    const title = extractMatch(/<title[^>]*>([\s\S]*?)<\/title>/i, html)
    const metaDescription = extractMatch(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i, html)
    const excerpt = buildExcerpt(html)
    return {
      status: response.status,
      title,
      summary: metaDescription || excerpt,
      excerpt,
      error: response.ok ? null : `HTTP ${response.status}`,
    }
  } catch (error) {
    return {
      status: null,
      title: null,
      summary: '',
      excerpt: '',
      error: error instanceof Error ? error.message : 'Unknown fetch error',
    }
  } finally {
    clearTimeout(timeout)
  }
}

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient() as any
  const sources = getVerifiedSourceCatalog()
  const runStartedAt = new Date().toISOString()

  let checkedCount = 0
  let changedCount = 0
  let failedCount = 0

  for (const source of sources) {
    checkedCount += 1
    const snapshot = await fetchSourceSnapshot(source.url)
    const nextSummary = snapshot.summary || source.keySignals.join('; ')
    const nextTitle = snapshot.title || source.title

    const { data: existing } = await admin
      .from('executive_research_library')
      .select('source_title, source_summary, last_excerpt, last_http_status')
      .eq('source_key', source.key)
      .maybeSingle()

    const changed = !existing
      || existing.source_title !== nextTitle
      || existing.source_summary !== nextSummary
      || existing.last_excerpt !== snapshot.excerpt
      || existing.last_http_status !== snapshot.status

    if (changed) changedCount += 1
    if (snapshot.error) failedCount += 1

    await admin.from('executive_research_library').upsert({
      source_key: source.key,
      source_title: nextTitle,
      source_url: source.url,
      source_tier: source.tier,
      source_category: source.category,
      source_summary: nextSummary,
      key_signals: source.keySignals,
      last_http_status: snapshot.status,
      last_excerpt: snapshot.excerpt,
      fetch_error: snapshot.error,
      last_checked_at: runStartedAt,
      last_changed_at: changed ? runStartedAt : existing?.last_changed_at ?? null,
      updated_at: runStartedAt,
    }, { onConflict: 'source_key' })
  }

  await admin.from('executive_research_refresh_runs').insert({
    run_started_at: runStartedAt,
    run_finished_at: new Date().toISOString(),
    checked_count: checkedCount,
    changed_count: changedCount,
    failed_count: failedCount,
    notes: 'Weekly verified-source refresh across the executive research stack.',
  })

  return NextResponse.json({
    ok: true,
    checkedCount,
    changedCount,
    failedCount,
    runStartedAt,
  })
}
