import type { DailyMomentumAction } from '@/components/DailyMomentumPlan'

// Daily momentum action builder with the "why chain" (Aleksei 2.5):
// every recommended action carries why-now (the trigger) and why-you
// (the connection to this user's strategy), plus deep links.

type WarmPathInput = {
  contactId: string
  contactName: string
  contactTitle: string | null
  companyId: string
  companyName: string
  signal: {
    signal_type: string
    signal_summary: string
    signal_date: string
    outreach_angle?: string | null
  }
}

export type MomentumActionInputs = {
  warmPath: WarmPathInput | null
  overdueCount: number
  interviewingCompany: { id: string; name: string } | null
  profileScore: number
  profileHref: string
  signalCount: number
  totalCount: number
  targetTitles: string[]
  targetSectors: string[]
}

function signalDateLabel(signalDate: string): string {
  const parsed = Date.parse(`${signalDate}T12:00:00Z`)
  if (Number.isNaN(parsed)) return ''
  return new Date(parsed).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function targetPhrase(targetTitles: string[], targetSectors: string[]): string {
  if (targetTitles.length > 0) return `your target ${targetTitles[0]} search`
  if (targetSectors.length > 0) return `your focus on ${targetSectors[0]}`
  return 'your search'
}

export function buildDailyMomentumActions(inputs: MomentumActionInputs): DailyMomentumAction[] {
  const {
    warmPath,
    overdueCount,
    interviewingCompany,
    profileScore,
    profileHref,
    signalCount,
    totalCount,
    targetTitles,
    targetSectors,
  } = inputs

  const relationshipAction: DailyMomentumAction = warmPath
    ? {
        id: 'relationship-action',
        track: 'relationship',
        title: `Re-engage ${warmPath.contactName} at ${warmPath.companyName}`,
        body: 'Send a short relationship-building message using the signal as context, not as the pitch.',
        whyNow: `${warmPath.companyName} fired a ${warmPath.signal.signal_type.replace(/_/g, ' ')} signal${signalDateLabel(warmPath.signal.signal_date) ? ` on ${signalDateLabel(warmPath.signal.signal_date)}` : ''}: ${warmPath.signal.signal_summary}`,
        whyYou: `${warmPath.companyName} is in your pipeline for ${targetPhrase(targetTitles, targetSectors)}, and ${warmPath.contactName}${warmPath.contactTitle ? ` (${warmPath.contactTitle})` : ''} is a contact you already hold there.`,
        effortMinutes: 15,
        href: `/dashboard/contacts/${warmPath.contactId}/outreach`,
        cta: 'Draft outreach',
        links: [
          { label: 'View signal', href: '/dashboard/signals' },
          { label: 'View company', href: `/dashboard/companies/${warmPath.companyId}` },
        ],
      }
    : overdueCount > 0
      ? {
          id: 'relationship-action',
          track: 'relationship',
          title: 'Clear the next relationship follow-up',
          body: 'Close one loop before you add anything new.',
          whyNow: `${overdueCount} follow-up${overdueCount === 1 ? ' is' : 's are'} past due.`,
          whyYou: 'A due follow-up is a conversation you already earned. Recovering it costs less than starting a new one.',
          effortMinutes: 15,
          href: '/dashboard/calendar',
          cta: 'Calendar',
        }
      : {
          id: 'relationship-action',
          track: 'relationship',
          title: 'Pick one warm relationship to move',
          body: 'Open contacts, choose one person who can unblock a real conversation, and schedule the next step.',
          whyNow: 'No live signal or overdue follow-up is queued, so relationship depth is the best use of this slot.',
          whyYou: `Senior roles in ${targetPhrase(targetTitles, targetSectors)} fill through relationships before postings.`,
          effortMinutes: 15,
          href: '/dashboard/contacts',
          cta: 'Contacts',
        }

  const readinessAction: DailyMomentumAction = interviewingCompany
    ? {
        id: 'readiness-action',
        track: 'readiness',
        title: `Generate prep for ${interviewingCompany.name}`,
        body: 'Run the prep brief and review the likely questions before the next conversation.',
        whyNow: `You have a live interview process at ${interviewingCompany.name}.`,
        whyYou: 'A live conversation outranks pipeline expansion: conversion quality here decides the search.',
        effortMinutes: 25,
        href: `/dashboard/companies/${interviewingCompany.id}/prep`,
        cta: 'Prep brief',
        links: [{ label: 'View company', href: `/dashboard/companies/${interviewingCompany.id}` }],
      }
    : profileScore < 100
      ? {
          id: 'readiness-action',
          track: 'readiness',
          title: 'Tighten the profile inputs driving your search',
          body: 'Complete the next profile section so briefs and briefings calibrate correctly.',
          whyNow: `Your profile is at ${profileScore}% and every brief generated today inherits the gaps.`,
          whyYou: 'Briefing quality, prep quality, and positioning all degrade when the profile is incomplete.',
          effortMinutes: 20,
          href: profileHref,
          cta: 'Profile',
        }
      : {
          id: 'readiness-action',
          track: 'readiness',
          title: 'Run one readiness pass before more outreach',
          body: 'Use the strategy layer to sharpen what you will say before the next live conversation opens.',
          whyNow: 'No live interview is queued, which makes this the lowest-cost moment to sharpen the narrative.',
          whyYou: `Your profile inputs are complete, so the strategy layer can work from ${targetPhrase(targetTitles, targetSectors)}.`,
          effortMinutes: 20,
          href: '/dashboard/strategy',
          cta: 'Strategy',
        }

  const focusAction: DailyMomentumAction =
    signalCount > 0
      ? {
          id: 'focus-action',
          track: 'focus',
          title: 'Review the freshest market signals',
          body: 'Pick the one signal most relevant to your targets and turn it into an outreach angle today.',
          whyNow: `${signalCount} signal${signalCount === 1 ? '' : 's'} landed this week and signal freshness decays fast.`,
          whyYou: `Signals are matched against your tracked companies, so each one is a timing edge for ${targetPhrase(targetTitles, targetSectors)}.`,
          effortMinutes: 15,
          href: '/dashboard/signals',
          cta: 'Signals',
        }
      : totalCount < 12
        ? {
            id: 'focus-action',
            track: 'focus',
            title: 'Add one more target company',
            body: 'Add one target with a real reason it belongs in the search.',
            whyNow: `Your pipeline has ${totalCount} ${totalCount === 1 ? 'company' : 'companies'}; thin pipelines create pressure and reactive choices.`,
            whyYou: 'More tracked companies means more signal coverage working for you overnight.',
            effortMinutes: 15,
            href: '/dashboard/companies/new',
            cta: 'Company',
          }
        : {
            id: 'focus-action',
            track: 'focus',
            title: 'Convert today into a concrete next step',
            body: 'Pick the next visible move instead of expanding scope.',
            whyNow: overdueCount > 0 ? 'Overdue actions outrank new scope.' : 'The pipeline is built; execution is the constraint now.',
            whyYou: 'Your coverage is already broad, so conversion quality is worth more than one more target.',
            effortMinutes: 10,
            href: overdueCount > 0 ? '/dashboard/calendar' : '/dashboard/briefing',
            cta: overdueCount > 0 ? 'Calendar' : 'Briefing',
          }

  return [relationshipAction, readinessAction, focusAction]
}
