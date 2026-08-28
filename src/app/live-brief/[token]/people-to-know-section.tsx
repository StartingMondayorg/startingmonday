'use client'

import {
  APOLLO_PEOPLE_URL,
  buildLinkedInPeopleSearchUrl,
  PEOPLE_TO_KNOW_TRUST_COPY,
  type PeopleToKnowHandoff,
} from '@/lib/people-to-know-handoff'

export default function PeopleToKnowSection({
  entries,
  onHandoff,
}: {
  entries: PeopleToKnowHandoff[]
  onHandoff?: (destination: 'linkedin' | 'apollo') => void
}) {
  if (entries.length === 0) return null

  return (
    <section className="border-t border-border/15 py-6">
      <h2 className="text-xl font-semibold text-foreground">People to know</h2>
      <div className="mt-4 divide-y divide-border/10 border-y border-border/10">
        {entries.map((entry) => {
          const linkedInUrl = buildLinkedInPeopleSearchUrl(entry)
          return (
            <article key={`${entry.companyName}-${entry.roleTitle}`} className="py-5">
              <h3 className="text-[15px] font-semibold text-foreground">{entry.roleTitle}</h3>
              <p className="mt-2 max-w-2xl text-[14px] leading-6 text-muted-foreground">{entry.whyThem}</p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-semibold">
                {linkedInUrl && (
                  <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" onClick={() => onHandoff?.('linkedin')} className="text-primary underline underline-offset-4 hover:text-primary/80">
                    Find on LinkedIn
                  </a>
                )}
                <a href={APOLLO_PEOPLE_URL} target="_blank" rel="noopener noreferrer" onClick={() => onHandoff?.('apollo')} className="text-muted-foreground underline underline-offset-4 hover:text-foreground">
                  Open in your Apollo account
                </a>
              </div>
            </article>
          )
        })}
      </div>
      <p className="mt-4 max-w-2xl text-[12px] leading-5 text-muted-foreground">{PEOPLE_TO_KNOW_TRUST_COPY}</p>
    </section>
  )
}