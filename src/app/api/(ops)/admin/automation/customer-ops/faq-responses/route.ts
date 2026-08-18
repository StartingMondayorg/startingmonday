/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'

function answerFaq(question: string): { answer: string; confidence: number } {
  const text = question.toLowerCase()
  if (/(billing|invoice|charge|receipt)/.test(text)) {
    return {
      answer: 'Billing details live in Dashboard > Settings > Billing. You can manage plan, payment method, and invoices there.',
      confidence: 90,
    }
  }
  if (/(brief|prep brief|briefing)/.test(text)) {
    return {
      answer: 'Your prep briefs are generated from your tracked companies, contacts, and latest signals. Add at least one company and one contact for strongest output.',
      confidence: 88,
    }
  }
  if (/(cancel|pause|resume|subscription)/.test(text)) {
    return {
      answer: 'You can pause or resume your subscription from billing settings. Changes are reflected immediately in your account status.',
      confidence: 85,
    }
  }
  return {
    answer: 'Thanks for the question. The fastest path is to check the Help section in dashboard for step-by-step guidance, or contact support for a tailored answer.',
    confidence: 65,
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth(request)
    if (!authCheck.ok) return authCheck.response

    const auth = await requireStaffAutomationAccess(request)
    if (!auth.ok) return auth.response

    const { userId, supabase } = auth
    const sb = supabase as any
    const body = await request.json().catch(() => ({}))
    const question = (body?.question ?? '').toString().trim()

    if (!question) return NextResponse.json({ error: 'question is required' }, { status: 400 })

    const result = answerFaq(question)
    await sb.from('faq_response_logs').insert({
      user_id: userId,
      question,
      answer: result.answer,
      confidence: result.confidence,
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('[customer-ops.faq-responses] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
