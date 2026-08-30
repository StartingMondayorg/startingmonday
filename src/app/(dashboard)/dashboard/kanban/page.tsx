import Link from 'next/link'

export const metadata = {
  title: 'Kanban Redirect - Starting Monday',
}

export default function KanbanPage() {
  return (
    <main className="min-h-screen bg-muted px-4 py-12 sm:px-6">
      <div className="max-w-2xl mx-auto rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h1 className="text-[24px] font-bold text-foreground mb-3">Kanban moved to the main dashboard</h1>
        <p className="text-[14px] text-muted-foreground leading-relaxed mb-6">
          The board experience now lives inside the dashboard so pipeline actions, company updates, and next steps stay in one operating surface.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard" className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-muted transition-colors">
            Open dashboard
          </Link>
          <Link href="/dashboard" className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-[13px] font-semibold text-muted-foreground transition-colors">
            Review companies
          </Link>
          <Link href="/dashboard/briefing" className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-[13px] font-semibold text-muted-foreground transition-colors">
            Open briefing
          </Link>
        </div>
      </div>
    </main>
  )
}
