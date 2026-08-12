'use client'

import { useState } from 'react'
import type { OnboardingChannel } from '@/lib/onboarding-speed'
import { computeElapsedSeconds } from '@/lib/onboarding-speed'
import type { OnboardingDraft } from '@/lib/onboarding-state'
import type { RoleFamily, RoleTitle } from '@/lib/role-taxonomy'
import type { SearchPersona } from './onboarding-helpers'

export function useOnboardingDraftState(initialDraft: OnboardingDraft) {
  const [advancedSetup, setAdvancedSetup] = useState(initialDraft.advancedSetup)
  const [fullName, setFullName] = useState(initialDraft.fullName)
  const [searchPersona, setSearchPersona] = useState<SearchPersona | ''>(initialDraft.searchPersona as SearchPersona | '')
  const [roleFamily, setRoleFamily] = useState<RoleFamily | ''>(initialDraft.roleFamily)
  const [roleTitle, setRoleTitle] = useState<RoleTitle | ''>(initialDraft.roleTitle)
  const [roleTitles, setRoleTitles] = useState<RoleTitle[]>(initialDraft.roleTitles)
  const [employmentStatus, setEmploymentStatus] = useState(initialDraft.employmentStatus)
  const [searchTimeline, setSearchTimeline] = useState(initialDraft.searchTimeline)
  const [searchDriver, setSearchDriver] = useState(initialDraft.searchDriver)
  const [currentTitle, setCurrentTitle] = useState(initialDraft.currentTitle)
  const [currentCompany, setCurrentCompany] = useState(initialDraft.currentCompany)
  const [resumeText, setResumeText] = useState(initialDraft.resumeText)
  const [positioningSummary, setPositioningSummary] = useState(initialDraft.positioningSummary)
  const [beyondResume, setBeyondResume] = useState(initialDraft.beyondResume)
  const [targetTitles, setTargetTitles] = useState(initialDraft.targetTitles)
  const [linkedinUrl, setLinkedinUrl] = useState(initialDraft.linkedinUrl)
  const [companyNames, setCompanyNames] = useState<string[]>(
    initialDraft.companyNames.length > 0 ? [...initialDraft.companyNames, ''] : ['', '', ''],
  )
  const [briefingTime, setBriefingTime] = useState(initialDraft.briefingTime)
  const [briefingFrequency, setBriefingFrequency] = useState<'daily' | 'weekly'>(initialDraft.briefingFrequency)
  const [emailNudgesOptIn, setEmailNudgesOptIn] = useState(initialDraft.emailNudgesOptIn)
  const [targetLocations, setTargetLocations] = useState<string[]>(initialDraft.targetLocations)
  const [targetSectors, setTargetSectors] = useState<string[]>(initialDraft.targetSectors)
  const [compPreference, setCompPreference] = useState<string[]>(initialDraft.compPreference)
  const [positioningStyle, setPositioningStyle] = useState<string[]>(initialDraft.positioningStyle)

  function buildDraft(nextAdvancedSetup = advancedSetup): OnboardingDraft {
    return {
      fullName,
      searchPersona,
      roleFamily,
      roleTitle,
      roleTitles,
      employmentStatus,
      searchTimeline,
      searchDriver,
      currentTitle,
      currentCompany,
      resumeText,
      positioningSummary,
      beyondResume,
      targetTitles,
      linkedinUrl,
      companyNames: companyNames.map(name => name.trim()).filter(Boolean),
      briefingTime,
      briefingFrequency,
      emailNudgesOptIn,
      targetLocations,
      targetSectors,
      compPreference,
      positioningStyle,
      advancedSetup: nextAdvancedSetup,
    }
  }

  return {
    advancedSetup, setAdvancedSetup, fullName, setFullName,
    searchPersona, setSearchPersona, roleFamily, setRoleFamily,
    roleTitle, setRoleTitle, roleTitles, setRoleTitles,
    employmentStatus, setEmploymentStatus, searchTimeline, setSearchTimeline,
    searchDriver, setSearchDriver, currentTitle, setCurrentTitle,
    currentCompany, setCurrentCompany, resumeText, setResumeText,
    positioningSummary, setPositioningSummary, beyondResume, setBeyondResume,
    targetTitles, setTargetTitles, linkedinUrl, setLinkedinUrl,
    companyNames, setCompanyNames, briefingTime, setBriefingTime,
    briefingFrequency, setBriefingFrequency, emailNudgesOptIn, setEmailNudgesOptIn,
    targetLocations, setTargetLocations, targetSectors, setTargetSectors,
    compPreference, setCompPreference, positioningStyle, setPositioningStyle,
    buildDraft,
  }
}

export function reportOnboardingStepCompleted(input: {
  step: number
  onboardingStartedAt: string
  lowEnergyMode: boolean
  onboardingChannel: OnboardingChannel
}) {
  fetch('/api/onboarding/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: 'onboarding_step_completed',
      properties: {
        step: input.step,
        elapsed_seconds: computeElapsedSeconds(input.onboardingStartedAt),
        low_energy_mode: input.lowEnergyMode,
        channel: input.onboardingChannel,
        mode: input.lowEnergyMode ? 'low_energy' : 'standard',
        confidence_band: null,
        action_context: 'onboarding_step_completed',
      },
    }),
  }).catch(() => {})
}