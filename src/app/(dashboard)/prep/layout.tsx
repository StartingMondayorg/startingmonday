// Interview prep is the one remaining /prep page (R-3 phase 2b folded meetings,
// communications and relationships), so the tab strip is gone.
export default function PrepLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </div>
    </div>
  )
}