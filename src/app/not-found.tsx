import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-muted font-sans flex items-center justify-center">
      <div className="text-center">
        <div className="text-[72px] font-bold text-muted-foreground leading-none">404</div>
        <h1 className="text-[24px] font-bold text-foreground mt-4">Page not found</h1>
        <p className="text-[14px] text-muted-foreground mt-2">This page doesn&apos;t exist or has been moved.</p>
        <Link
          href="/dashboard"
          className="inline-block mt-6 text-[14px] font-semibold text-foreground hover:text-muted-foreground"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  )
}
