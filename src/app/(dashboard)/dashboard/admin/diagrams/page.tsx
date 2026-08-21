import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember, hasAdminHeaderAccess } from '@/lib/staff'
import { DiagramsClient } from './diagrams-client'
import { DIAGRAM_CATEGORIES } from './diagrams-data'

export default async function DiagramsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const staff = await getStaffMember(user.email ?? '')
  if (!hasAdminHeaderAccess(staff)) notFound()

  const totalDiagrams = DIAGRAM_CATEGORIES.reduce((n, c) => n + c.diagrams.length, 0)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <a href="/dashboard/admin/internal-guide" className="text-[12px] text-primary">
          ← Internal Guide
        </a>
        <h1 className="text-[22px] font-bold text-foreground mt-2">Architecture Diagrams</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          {totalDiagrams} diagrams across {DIAGRAM_CATEGORIES.length} categories. Click any card to view the rendered diagram.
        </p>
      </div>
      <DiagramsClient categories={DIAGRAM_CATEGORIES} />
    </div>
  )
}
