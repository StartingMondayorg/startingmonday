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
    <section className="border-t border-slate-900/15 py-6">
      <h2 className="text-xl font-semibold text-slate-900">People to know</h2>
      <div className="mt-4 divide-y divide-slate-900/10 border-y border-slate-900/10">
        {entries.map((entry) => {
          const linkedInUrl = buildLinkedInPeopleSearchUrl(entry)
          return (
            <article key={`${entry.companyName}-${entry.roleTitle}`} className="py-5">
              <h3 className="text-[15px] font-semibold text-slate-900">{entry.roleTitle}</h3>
              <p className="mt-2 max-w-2xl text-[14px] leading-6 text-slate-700">{entry.whyThem}</p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-semibold">
                {linkedInUrl && (
                  <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" onClick={() => onHandoff?.('linkedin')} className="text-orange-700 underline underline-offset-4 hover:text-orange-800">
                    Find on LinkedIn
                  </a>
                )}
                <a href={APOLLO_PEOPLE_URL} target="_blank" rel="noopener noreferrer" onClick={() => onHandoff?.('apollo')} className="text-slate-700 underline underline-offset-4 hover:text-slate-950">
                  Open in your Apollo account
                </a>
              </div>
            </article>
          )
        })}
      </div>
      <p className="mt-4 max-w-2xl text-[12px] leading-5 text-slate-500">{PEOPLE_TO_KNOW_TRUST_COPY}</p>
    </section>
  )
}