export default function UnsubscribeConfirmedPage() {
  return (
    <div className="min-h-screen bg-muted font-sans flex items-center justify-center px-4">
      <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      <div className="w-full max-w-sm">
        <p className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-4">
          Starting Monday
        </p>
        <h1 className="text-[22px] font-bold text-foreground mb-2">You are unsubscribed.</h1>
        <p className="text-[14px] text-muted-foreground leading-relaxed">
          You will not receive any further marketing emails from Starting Monday. We wish you well.
        </p>
      </div>
    </div>
  )
}

