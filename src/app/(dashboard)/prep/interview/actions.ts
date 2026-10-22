'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isInterviewPrepEmpty, parseInterviewPrepForm } from './interview-prep-form'

export async function saveInterviewPrep(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const input = parseInterviewPrepForm(formData)
  if (isInterviewPrepEmpty(input)) redirect('/prep/interview?error=empty')

  const fields = {
    company_name: input.companyName,
    role_title: input.roleTitle,
    interview_at: input.interviewAt,
    answers: input.answers,
    status: input.status,
  }
  const row = { user_id: user.id, ...fields }

  let savedId = input.id
  let error: { message: string } | null = null

  if (input.id) {
    const result = await supabase
      .from('interview_preps')
      .update(fields)
      .eq('id', input.id)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle()
    error = result.error
    // A stale id (deleted, or not this user's) falls through to an insert rather than silently losing the work.
    if (!result.error && !result.data) savedId = null
  }

  if (!savedId && !error) {
    const result = await supabase.from('interview_preps').insert(row).select('id').single()
    error = result.error
    savedId = result.data?.id ?? null
  }

  if (error || !savedId) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), event: 'interview_prep_save_error', error: error?.message ?? 'no id' }))
    redirect(`/prep/interview?error=save${input.id ? `&id=${input.id}` : ''}`)
  }

  revalidatePath('/prep/interview')
  redirect(`/prep/interview?id=${savedId}&saved=${input.status}`)
}

export async function deleteInterviewPrep(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id')
  if (typeof id === 'string' && id) {
    await supabase.from('interview_preps').delete().eq('id', id).eq('user_id', user.id)
  }

  revalidatePath('/prep/interview')
  redirect('/prep/interview')
}
