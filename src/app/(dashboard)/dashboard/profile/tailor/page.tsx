import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserSubscription, canAccessFeature } from '@/lib/billing/subscription'
import { ResumeTailor } from '@/app/(dashboard)/dashboard/_components/ResumeTailor'
import { LogoutButton } from '../../logout-button'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function TailorPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>
}) {
  const { companyId } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, sub, companyResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('full_name, resume_text, target_titles, current_title')
      .eq('user_id', user.id)
      .single(),
    getUserSubscription(user.id),
    companyId
      ? supabase
          .from('companies')
          .select('id, name')
          .eq('id', companyId)
          .eq('user_id', user.id)
          .is('archived_at', null)
          .single()
      : Promise.resolve({ data: null }),
  ])

  // Fetch job description doc for this company if provided
  let jobDescription = ''
  if (companyId) {
    const { data: jdDoc } = await supabase
      .from('company_documents')
      .select('content')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .eq('label', 'job_description')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    jobDescription = jdDoc?.content ?? ''
  }

  const company = companyResult?.data ?? null
  const canTailor = canAccessFeature(sub, 'resume_tailor')
  const hasResume = (profile?.resume_text?.length ?? 0) >= 200

  return (
    <div className="min-h-screen bg-slate-100 font-sans">

      <header className="bg-slate-900">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400 hover:text-slate-300 transition-colors">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4">
            {company ? (
              <Link href={`/dashboard/companies/${company.id}`} className="text-[12px] text-slate-300 hover:text-white transition-colors">
                Back to {company.name}
              </Link>
            ) : (
              <Link href="/dashboard/profile" className="text-[12px] text-slate-300 hover:text-white transition-colors">
                Back to profile
              </Link>
            )}
            <div className="hidden sm:block">
              <LogoutButton label="Sign out" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        <div className="mb-8">
          <h1 className="text-[26px] font-bold text-slate-900 leading-tight">
            {company ? `Tailor Resume for ${company.name}` : 'Tailor Resume'}
          </h1>
          <p className="text-[14px] text-slate-500 mt-2 leading-relaxed">
            Paste the job description. Your resume will be rewritten to match the role, with keyword analysis and a summary of what changed.
          </p>
        </div>

        {/* Upgrade gate */}
        {!canTailor && (
          <Card className="bg-slate-900 ring-0 rounded p-6 sm:p-8 text-center">
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-3">Search plan required</p>
            <h2 className="text-[20px] font-bold text-white leading-tight mb-3">
              Resume tailoring is a Search feature.
            </h2>
            <p className="text-[14px] text-slate-400 leading-relaxed mb-6 max-w-sm mx-auto">
              Upgrade to Search to tailor your resume for any role, with keyword analysis and .docx export.
            </p>
            <Button render={<Link href="/settings/billing" />}>
              Upgrade to Search
            </Button>
          </Card>
        )}

        {/* No resume */}
        {canTailor && !hasResume && (
          <Card className="rounded p-8 text-center">
            <p className="text-[15px] font-semibold text-slate-900 mb-2">No resume on file</p>
            <p className="text-[13px] text-slate-500 leading-relaxed mb-5">
              Upload your resume in your profile first. It takes about 30 seconds.
            </p>
            <Button render={<Link href="/dashboard/profile" />}>
              Go to profile
            </Button>
          </Card>
        )}

        {/* Main tailor UI */}
        {canTailor && hasResume && (
          <ResumeTailor
            resumeText={profile!.resume_text!}
            initialJobDescription={jobDescription}
            companyName={company?.name ?? ''}
            companyId={companyId}
            defaultTargetTitle={(profile?.target_titles ?? [])[0] ?? profile?.current_title ?? ''}
          />
        )}

      </main>
    </div>
  )
}

