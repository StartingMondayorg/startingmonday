import { ExecutiveBriefHub, type ExecutiveBriefHubData } from '@/app/(dashboard)/dashboard/executive-brief/executive-brief-hub'

export const metadata = {
  title: 'Executive Brief - Starting Monday',
}

const demoData: ExecutiveBriefHubData = {
  userName: 'Preview User',
  companies: [],
  briefs: [],
  peopleToReachOut: [],
  recentInterviewSignals: [],
}

export default function PublicExecutiveBriefPage() {
  return (
    <>
      <h1 className="sr-only">Starting Monday executive brief demo</h1>
      <ExecutiveBriefHub data={demoData} enableLivePrefetch={false} />
    </>
  )
}
