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
      <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_18px_70px_rgba(15,23,42,0.2)] backdrop-blur-sm sm:p-7">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-200">{eyebrow}</p>
        <h2 className="mb-5 text-[22px] font-bold leading-snug text-white">{title}</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {stories.map((story) => (
            <article key={story.title} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <p className="mb-1 text-[13px] font-semibold text-white">{story.title}</p>
              <p className="mb-2 text-[12px] text-orange-200">{story.role}</p>
              <p className="text-[13px] leading-relaxed text-slate-200">{story.outcome}</p>
            </article>
          ))}
        </div>
        {sourceNote && <p className="mt-4 text-[12px] leading-relaxed text-slate-300">{sourceNote}</p>}
      </div>
    </section>
  )
}
