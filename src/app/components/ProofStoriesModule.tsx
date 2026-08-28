type ProofStory = {
  title: string
  role: string
  outcome: string
}

type ProofStoriesModuleProps = {
  eyebrow?: string
  title: string
  stories: ProofStory[]
  sourceNote?: string
}

export function ProofStoriesModule({
  eyebrow = 'Role-specific proof',
  title,
  stories,
  sourceNote,
}: ProofStoriesModuleProps) {
  if (!stories.length) return null

  return (
    <section className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-background/55 p-6 shadow-xl backdrop-blur-sm sm:p-7">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
        <h2 className="mb-5 text-[22px] font-bold leading-snug text-foreground">{title}</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {stories.map((story) => (
            <article key={story.title} className="rounded-2xl border border-border bg-muted/[0.05] p-4">
              <p className="mb-1 text-[13px] font-semibold text-foreground">{story.title}</p>
              <p className="mb-2 text-[12px] text-primary">{story.role}</p>
              <p className="text-[13px] leading-relaxed text-foreground">{story.outcome}</p>
            </article>
          ))}
        </div>
        {sourceNote && <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">{sourceNote}</p>}
      </div>
    </section>
  )
}
