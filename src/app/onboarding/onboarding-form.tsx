'use client'
import { useState, useRef, useEffect } from 'react'
import { completeOnboarding, saveOnboardingProgress, skipOnboarding } from './actions'
import { HelpQuickButton } from '@/app/components/HelpQuickButton'
import { Alert, AlertDescription, Button, Card, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, ToggleGroup, ToggleGroupItem } from '@/components/ui'
import {
  type SearchPersona,
  seededCompaniesFor,
  suggestedCompaniesForProfile,
} from './onboarding-helpers'
import {
  type OnboardingChannel,
  computeElapsedSeconds,
  estimateManualFieldReduction,
  isTransitionFirstCohort,
} from '@/lib/onboarding/onboarding-speed'
import { type RoleFamily, type RoleTitle } from '@/lib/role-taxonomy'
import { ScanProgressPanel, type ScanStatusPayload } from './scan-progress-panel'
import { RelationshipProgressPanel, type RelationshipStatusPayload } from './relationship-progress-panel'
import { OnboardingContextStep } from './onboarding-context-step'
import { OnboardingDoneStep } from './onboarding-done-step'
import { LinkedinImportProgress, type LinkedinImportProgressState } from '@/app/components/LinkedinImportProgress'
import type { OnboardingDraft } from '@/lib/onboarding/onboarding-state'
import { reportOnboardingStepCompleted, useOnboardingDraftState } from './use-onboarding-draft-state'
import { resolveDashboardSearchPosture } from '@/lib/dashboard-posture'

type ImportResult = {
  full_name?: string | null
  current_title?: string | null
  current_company?: string | null
  positioning_summary?: string | null
  resume_text?: string | null
  beyond_resume?: string | null
  target_titles?: string | null
}

type RoleTrackOption = {
  value: RoleTitle
  roleFamily: RoleFamily
  persona: SearchPersona
  label: string
  sub: string
}

const ROLE_TRACK_OPTIONS: RoleTrackOption[] = [
  { value: 'manager', roleFamily: 'leadership', persona: 'director', label: 'Manager', sub: 'Leadership track for first-line managers' },
  { value: 'senior_director', roleFamily: 'leadership', persona: 'director', label: 'Senior Director', sub: 'Leadership track for org-level scope' },
  { value: 'avp', roleFamily: 'leadership', persona: 'vp', label: 'AVP / VP', sub: 'Leadership track with broad business ownership' },
  { value: 'executive', roleFamily: 'leadership', persona: 'csuite', label: 'Executive', sub: 'C-suite and enterprise leadership path' },
  { value: 'principal', roleFamily: 'technical_leadership', persona: 'director', label: 'Principal', sub: 'Technical leadership without direct org management' },
  { value: 'architect', roleFamily: 'technical_leadership', persona: 'director', label: 'Architect', sub: 'Architecture and platform strategy path' },
  { value: 'technical_lead', roleFamily: 'technical_leadership', persona: 'director', label: 'Technical Lead', sub: 'Hands-on technical leadership track' },
  { value: 'program_manager', roleFamily: 'delivery_leadership', persona: 'director', label: 'Program Manager', sub: 'Cross-functional delivery leadership path' },
  { value: 'tpm', roleFamily: 'delivery_leadership', persona: 'director', label: 'Technical Program Manager', sub: 'Technical delivery and execution path' },
  { value: 'project_manager', roleFamily: 'delivery_leadership', persona: 'director', label: 'Project Manager', sub: 'Execution-focused delivery leadership path' },
]

const STEP_COUNT = 9
const QUICK_PATH_STEP_COUNT = 7

function Dots({ current, total = STEP_COUNT }: { current: number; total?: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={[
            'rounded-full transition-all duration-300',
            i === current ? 'w-5 h-1.5 bg-primary' : i < current ? 'w-1.5 h-1.5 bg-muted' : 'w-1.5 h-1.5 bg-muted/80',
          ].join(' ')}
        />
      ))}
    </div>
  )
}

export function OnboardingForm({
  initialDraft,
  initialStep,
  serverError,
}: {
  initialDraft: OnboardingDraft
  initialStep: number
  serverError: string | null
}) {
  const onboardingParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const channelParam = onboardingParams?.get('channel')
  const lowEnergyParam = onboardingParams?.get('mode') === 'low_energy' || onboardingParams?.get('from') === 'low-energy'

  const [step, setStep] = useState(initialStep)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [animating, setAnimating] = useState(false)
  const [savingProgress, setSavingProgress] = useState(false)
  const [progressError, setProgressError] = useState(serverError ?? '')
  const [onboardingChannel] = useState<OnboardingChannel>(() => {
    if (channelParam && ['executives', 'coaches', 'outplacement', 'search_firms'].includes(channelParam)) {
      return channelParam as OnboardingChannel
    }
    return 'executives'
  })
  const [lowEnergyMode] = useState(lowEnergyParam)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [onboardingStartedAt] = useState(() => new Date().toISOString())

  const {
    advancedSetup, setAdvancedSetup, fullName, setFullName,
    searchPersona, setSearchPersona, searchPosture, setSearchPosture, roleFamily, setRoleFamily,
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
  } = useOnboardingDraftState(initialDraft)

  const [intelContent, setIntelContent] = useState('')
  const [intelLoading, setIntelLoading] = useState(false)
  const resolvedSearchPosture = resolveDashboardSearchPosture({
    searchPosture,
    employmentStatus,
    searchTimeline,
  })

  const [scanStarted, setScanStarted] = useState(initialStep >= 6 && initialDraft.companyNames.length > 0)
  const [scanProgress, setScanProgress] = useState<ScanStatusPayload | null>(null)
  const [extraCompany, setExtraCompany] = useState('')
  const [addingCompany, setAddingCompany] = useState(false)

  const [enrichmentStarted, setEnrichmentStarted] = useState(initialStep >= 6 && initialDraft.companyNames.length > 0)
  const [relationshipProgress, setRelationshipProgress] = useState<RelationshipStatusPayload | null>(null)
  const [contactName, setContactName] = useState('')
  const [contactTitle, setContactTitle] = useState('')
  const [contactCompanyName, setContactCompanyName] = useState('')
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [addingContact, setAddingContact] = useState(false)

  const firstName = fullName.trim().split(' ')[0] || 'there'

  const isPassive = employmentStatus === 'employed_exploring' && searchTimeline === 'opportunistic'

  const [pasteText, setPasteText]     = useState('')
  const [importing, setImporting]     = useState(false)
  const [importDone, setImportDone]   = useState(Boolean(initialDraft.resumeText || initialDraft.positioningSummary))
  const [importThin, setImportThin]   = useState(false)
  const [importError, setImportError] = useState('')
  const [extracting, setExtracting]   = useState(false)
  const [manualMode, setManualMode]   = useState(false)
  const [importProgress, setImportProgress] = useState<LinkedinImportProgressState>({ status: 'idle' })
  const [importSource, setImportSource]     = useState<'pdf' | 'text'>('pdf')
  const [pdfFileName, setPdfFileName]       = useState('')

  const linkedinPdfRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const step7FetchStarted = useRef(false)
  const nudgeLogged = useRef(false)
  const startLogged = useRef(false)
  const firstValueLogged = useRef(false)

  const transitionFirst = isTransitionFirstCohort(employmentStatus, searchTimeline)

  const manualFieldReduction = estimateManualFieldReduction({
    fullName,
    currentTitle,
    currentCompany,
    searchPersona,
    companyCount: companyNames.filter((name) => name.trim()).length,
    importedProfile: importDone,
    lowEnergyMode,
  })

  useEffect(() => {
    if (step === 0) nameRef.current?.focus()
  }, [step])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds(computeElapsedSeconds(onboardingStartedAt))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [onboardingStartedAt])

  useEffect(() => {
    if (startLogged.current) return
    startLogged.current = true
    fetch('/api/onboarding/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'onboarding_started',
        properties: {
          started_at: onboardingStartedAt,
          channel: onboardingChannel,
          mode: lowEnergyMode ? 'low_energy' : 'standard',
          confidence_band: null,
          action_context: 'onboarding_started',
        },
      }),
    }).catch(() => {})
  }, [onboardingStartedAt, onboardingChannel, lowEnergyMode])

  useEffect(() => {
    if (step === 1 && isPassive && !manualMode) {
      const timeoutId = window.setTimeout(() => setManualMode(true), 0)
      return () => window.clearTimeout(timeoutId)
    }
  }, [step, isPassive, manualMode])

  useEffect(() => {
    if (step !== 3 || advancedSetup) return
    if (companyNames.some(n => n.trim())) return
    const seeded = seededCompaniesFor(searchPersona)
    if (seeded.length === 0) return
    const timeoutId = window.setTimeout(() => setCompanyNames([...seeded, '']), 0)
    return () => window.clearTimeout(timeoutId)
  }, [step, advancedSetup, companyNames, searchPersona])

  useEffect(() => {
    if (step < 8 || firstValueLogged.current) return
    firstValueLogged.current = true
    fetch('/api/onboarding/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'onboarding_first_value_ready',
        properties: {
          elapsed_seconds: elapsedSeconds,
          under_ten_minutes: elapsedSeconds <= 600,
          company_count: companyNames.filter((name) => name.trim()).length,
          wedge_surface: 'shortlist',
          transition_first: transitionFirst,
          low_energy_mode: lowEnergyMode,
          mode: lowEnergyMode ? 'low_energy' : 'standard',
          confidence_band: null,
          action_context: 'onboarding_first_value_ready',
        },
      }),
    }).catch(() => {})
  }, [step, elapsedSeconds, companyNames, transitionFirst, lowEnergyMode])

  useEffect(() => {
    if (step >= 8 || elapsedSeconds < 480 || nudgeLogged.current) return
    nudgeLogged.current = true
    fetch('/api/onboarding/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'onboarding_nudge_shown',
        properties: {
          elapsed_seconds: elapsedSeconds,
          step,
          transition_first: transitionFirst,
          mode: lowEnergyMode ? 'low_energy' : 'standard',
          confidence_band: null,
          action_context: 'onboarding_nudge_shown',
        },
      }),
    }).catch(() => {})
  }, [step, elapsedSeconds, transitionFirst, lowEnergyMode])

  useEffect(() => {
    if (step !== 8) return
    const firstCompany = companyNames.find(n => n.trim())
    if (!firstCompany || intelContent || intelLoading || step7FetchStarted.current) return
    step7FetchStarted.current = true
    setIntelLoading(true)
    fetch('/api/onboarding/intel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName: firstCompany.trim(), persona: searchPersona }),
    }).then(async res => {
      if (!res.body) return
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setIntelContent(text)
      }
    }).catch(() => {}).finally(() => setIntelLoading(false))
  }, [step, companyNames, intelContent, intelLoading, searchPersona])

  async function goTo(next: number, nextAdvancedSetup = advancedSetup) {
    if (animating || savingProgress) return
    if (next > step) {
      setSavingProgress(true)
      setProgressError('')
      try {
        await saveOnboardingProgress(next, buildDraft(nextAdvancedSetup))
      } catch (error) {
        setProgressError(error instanceof Error ? error.message : 'We could not save your progress. Please try again.')
        setSavingProgress(false)
        return
      }
      setSavingProgress(false)
      reportOnboardingStepCompleted({ step, onboardingStartedAt, lowEnergyMode, onboardingChannel })
    }

    setAdvancedSetup(nextAdvancedSetup)
    setDirection(next > step ? 'forward' : 'back')
    setAnimating(true)
    setTimeout(() => {
      setStep(next)
      setAnimating(false)
    }, 180)
  }

  function startFirstScan(names: string[]) {
    const filtered = names.map(n => n.trim()).filter(Boolean)
    if (filtered.length === 0 || scanStarted) return
    setScanStarted(true)
    fetch('/api/onboarding/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyNames: filtered }),
    }).catch(() => {})
  }

  function startRelationshipEnrichment(names: string[]) {
    const filtered = names.map(n => n.trim()).filter(Boolean)
    if (filtered.length === 0 || enrichmentStarted) return
    setEnrichmentStarted(true)
    fetch('/api/onboarding/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyNames: filtered }),
    }).catch(() => {})
  }

  async function addCompanyDuringScan() {
    const name = extraCompany.trim()
    if (!name || addingCompany) return
    if (companyNames.filter(n => n.trim()).length >= 8) return
    setAddingCompany(true)
    try {
      await fetch('/api/onboarding/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyNames: [name] }),
      })
      setCompanyNames(prev => [...prev.filter(n => n.trim()), name, ''])
      setExtraCompany('')
    } catch { /* leave input intact for retry */ } finally {
      setAddingCompany(false)
    }
  }

  async function addContactDuringEnrichment() {
    const name = contactName.trim()
    if (!name || addingContact) return
    let companyId = selectedCompanyId || relationshipProgress?.companies?.[0]?.companyId || ''
    // Recovery path: no companies loaded yet but the user typed one inline.
    const typedCompany = contactCompanyName.trim()
    if (!companyId && !typedCompany) return
    setAddingContact(true)
    try {
      if (!companyId && typedCompany) {
        const created = await fetch('/api/onboarding/enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyNames: [typedCompany] }),
        })
        if (created.ok) {
          const statusRes = await fetch('/api/onboarding/enrich')
          if (statusRes.ok) {
            const payload = await statusRes.json() as RelationshipStatusPayload
            setRelationshipProgress(payload)
            companyId = payload.companies.find(c => c.name.toLowerCase() === typedCompany.toLowerCase())?.companyId
              ?? payload.companies[0]?.companyId ?? ''
            if (companyId) setSelectedCompanyId(companyId)
          }
        }
      }
      if (!companyId) return
      await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          title: contactTitle.trim() || null,
          company_id: companyId,
          source: 'onboarding_relationship_step',
          enrichment_source: 'manual',
        }),
      })
      setContactName('')
      setContactTitle('')
      setContactCompanyName('')
      const res = await fetch('/api/onboarding/enrich')
      if (res.ok) {
        const payload = await res.json() as RelationshipStatusPayload
        setRelationshipProgress(payload)
      }
    } catch {
      // Keep values for retry.
    } finally {
      setAddingContact(false)
    }
  }

  useEffect(() => {
    if (step < 6 || !scanStarted) return
    let cancelled = false
    let ticks = 0
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/onboarding/scan')
        if (!res.ok) return
        const data = await res.json() as ScanStatusPayload
        if (cancelled) return
        setScanProgress(data)
        if (data?.progress?.done) window.clearInterval(id)
      } catch { /* keep polling */ }
    }
    const id = window.setInterval(() => {
      ticks += 1
      if (ticks > 30) { window.clearInterval(id); return }
      void fetchStatus()
    }, 4000)
    void fetchStatus()
    return () => { cancelled = true; window.clearInterval(id) }
  }, [step, scanStarted])

  useEffect(() => {
    if (step < 6 || !enrichmentStarted) return
    let cancelled = false
    let ticks = 0
    let retriedStart = false
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/onboarding/enrich')
        if (!res.ok) return
        const data = await res.json() as RelationshipStatusPayload
        if (cancelled) return
        setRelationshipProgress(data)
        if (!selectedCompanyId && data.companies.length > 0) {
          setSelectedCompanyId(data.companies[0].companyId)
        }
        // Self-heal: if the initial fire-and-forget POST failed (network blip,
        // auth race), the status will report zero companies even though the
        // user entered names. Re-trigger enrichment once so the contact form
        // does not dead-end with a disabled company select.
        if (data.companies.length === 0 && !retriedStart) {
          retriedStart = true
          const names = companyNames.map(n => n.trim()).filter(Boolean)
          if (names.length > 0) {
            fetch('/api/onboarding/enrich', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ companyNames: names }),
            }).catch(() => {})
          }
        }
        if (data?.progress?.done) window.clearInterval(id)
      } catch {
        // Keep polling while onboarding is active.
      }
    }
    const id = window.setInterval(() => {
      ticks += 1
      if (ticks > 30) { window.clearInterval(id); return }
      void fetchStatus()
    }, 4000)
    void fetchStatus()
    return () => { cancelled = true; window.clearInterval(id) }
  }, [step, enrichmentStarted, selectedCompanyId, companyNames])

  function advance() {
    if (step === 0) { goTo(1); return }
    if (step === 1) { goTo(2); return }
    if (step === 2) { goTo(3, false); return }
    if (step === 3) {
      startFirstScan(companyNames)
      startRelationshipEnrichment(companyNames)
      if (lowEnergyMode || !advancedSetup || isPassive) {
        if (isPassive) setBriefingFrequency('weekly')
        goTo(6)
        return
      }
      goTo(4)
      return
    }
    if (step === 4) { goTo(5); return }
    if (step === 5) {
      startRelationshipEnrichment(companyNames)
      goTo(6)
      return
    }
    if (step === 6) { goTo(7); return }
    if (step === 7) { goTo(8); return }
    if (step < STEP_COUNT - 1) goTo(step + 1)
  }

  function prevStep() {
    if (step === 3) return 2
    if (step === 4) return 3
    if (step === 5) return 4
    if (step === 6) return (isPassive || !advancedSetup || lowEnergyMode) ? 3 : 5
    if (step === 7) return 6
    if (step === 8) return 7
    return step - 1
  }

  function toggleRoleTrack(opt: RoleTrackOption) {
    setRoleTitles(prev => {
      const next = prev.includes(opt.value)
        ? prev.filter(v => v !== opt.value)
        : [...prev, opt.value]
      const primary = ROLE_TRACK_OPTIONS.find(o => o.value === next[0]) ?? null
      setRoleTitle(primary?.value ?? '')
      setRoleFamily(primary?.roleFamily ?? '')
      setSearchPersona(primary?.persona ?? '')
      return next
    })
  }

  function progressIndex() {
    if (advancedSetup) return step
    if (step <= 2) return step
    if (step === 3) return 3
    if (step === 6) return 4
    if (step === 7) return 5
    return 6
  }

  function applyImport(data: ImportResult) {
    if (data.full_name)            setFullName(data.full_name)
    if (data.current_title)        setCurrentTitle(data.current_title)
    if (data.current_company)      setCurrentCompany(data.current_company)
    if (data.positioning_summary)  setPositioningSummary(data.positioning_summary)
    if (data.resume_text)          setResumeText(data.resume_text)
    if (data.beyond_resume)        setBeyondResume(data.beyond_resume)
    if (data.target_titles)        setTargetTitles(data.target_titles)
    // Thin: only raw text was saved - structured fields (title, company) weren't extracted
    setImportThin(!data.current_title && !data.current_company)
    setImportDone(true)
  }

  async function handlePasteImport() {
    if (!pasteText.trim() || importing) return
    setImporting(true)
    setImportError('')
    setImportSource('text')
    setImportProgress({ status: 'running', stage: 0 })
    const text = pasteText
    try {
      const res = await fetch('/api/linkedin-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = res.ok ? await res.json() : {}
      await holdComplete()
      applyImport(data)
      if (!data.resume_text) setResumeText(text.slice(0, 20000))
      setPasteText('')
    } catch {
      await holdComplete()
      setResumeText(text.slice(0, 20000))
      setImportDone(true)
    } finally {
      setImporting(false)
      setImportProgress({ status: 'idle' })
    }
  }

  // Hold the finished bar and checkmark briefly so completion is seen, not just inferred.
  async function holdComplete() {
    setImportProgress({ status: 'complete' })
    await new Promise(resolve => window.setTimeout(resolve, 900))
  }

  async function handleLinkedInPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setExtracting(true)
    setImportError('')
    setPdfFileName(file.name)
    setImportSource('pdf')
    setImportProgress({ status: 'running', stage: 0 })
    try {
      const fd = new FormData()
      fd.append('file', file)
      const extractRes = await fetch('/api/linkedin-import/extract', { method: 'POST', body: fd })
      const extractData = await extractRes.json().catch(() => ({}))
      if (!extractRes.ok || !extractData.text) {
        setImportProgress({ status: 'idle' })
        setImportError('Could not read the PDF. Try pasting your profile text instead.')
        return
      }
      setImporting(true)
      setImportProgress({ status: 'running', stage: 1 })
      try {
        const importRes = await fetch('/api/linkedin-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: extractData.text }),
        })
        const data = importRes.ok ? await importRes.json() : {}
        await holdComplete()
        applyImport(data)
        if (!data.resume_text) setResumeText(extractData.text.slice(0, 20000))
      } catch {
        await holdComplete()
        setResumeText(extractData.text.slice(0, 20000))
        setImportDone(true)
      } finally {
        setImporting(false)
        setImportProgress({ status: 'idle' })
      }
    } finally {
      setExtracting(false)
      if (linkedinPdfRef.current) linkedinPdfRef.current.value = ''
    }
  }

  const slideClass = animating
    ? direction === 'forward'
      ? 'opacity-0 translate-x-4'
      : 'opacity-0 -translate-x-4'
    : 'opacity-100 translate-x-0'

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <form id="onboarding-form" action={completeOnboarding} className="hidden">
        <input type="hidden" name="full_name"           value={fullName} />
        <input type="hidden" name="search_persona"      value={searchPersona} />
        <input type="hidden" name="search_posture"      value={searchPosture || resolvedSearchPosture} />
        <input type="hidden" name="role_family"         value={roleFamily} />
        <input type="hidden" name="role_title"          value={roleTitle} />
        <input type="hidden" name="target_role_tracks"  value={JSON.stringify(roleTitles)} />
        <input type="hidden" name="onboarding_channel"  value={onboardingChannel} />
        <input type="hidden" name="onboarding_low_energy" value={lowEnergyMode ? 'true' : 'false'} />
        <input type="hidden" name="onboarding_started_at" value={onboardingStartedAt} />
        <input type="hidden" name="onboarding_elapsed_seconds" value={String(elapsedSeconds)} />
        <input type="hidden" name="manual_fields_baseline" value={String(manualFieldReduction.baselineManualFields)} />
        <input type="hidden" name="manual_fields_required" value={String(manualFieldReduction.requiredManualFields)} />
        <input type="hidden" name="manual_fields_reduction_rate" value={String(manualFieldReduction.reductionRate)} />
        <input type="hidden" name="employment_status"   value={employmentStatus} />
        <input type="hidden" name="search_timeline"     value={searchTimeline} />
        <input type="hidden" name="search_driver"       value={searchDriver} />
        <input type="hidden" name="current_title"       value={currentTitle} />
        <input type="hidden" name="current_company"     value={currentCompany} />
        <input type="hidden" name="resume_text"         value={resumeText} />
        <input type="hidden" name="positioning_summary" value={positioningSummary} />
        <input type="hidden" name="beyond_resume"       value={beyondResume} />
        <input type="hidden" name="target_titles"       value={targetTitles} />
        <input type="hidden" name="linkedin_url"        value={linkedinUrl} />
        <input type="hidden" name="company_names"        value={JSON.stringify(companyNames.filter(n => n.trim()))} />
        <input type="hidden" name="briefing_time"        value={briefingTime} />
        <input type="hidden" name="briefing_frequency"   value={briefingFrequency} />
        <input type="hidden" name="email_nudges_opt_in"  value={emailNudgesOptIn ? 'true' : 'false'} />
        <input type="hidden" name="target_locations"     value={targetLocations.join(',')} />
        <input type="hidden" name="target_sectors"       value={targetSectors.join(',')} />
        <input type="hidden" name="target_comp"          value={compPreference.join(',')} />
        <input type="hidden" name="positioning_style"    value={positioningStyle.join(',')} />
      </form>

      <Card variant="glass" className="w-full max-w-lg rounded-2xl border-border bg-card/80 p-5 shadow-xl sm:p-6">
        {/* Wordmark */}
        <div className="text-center mb-10">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground"><span className="text-foreground">Starting </span><span className="text-primary">Monday</span></span>
        </div>

        {progressError && (
          <Alert variant="destructive" className="mb-5">
            <AlertDescription>{progressError}</AlertDescription>
          </Alert>
        )}

        {/* Step content */}
        <div
          className={[
            'transition-all duration-200 ease-out',
            slideClass,
          ].join(' ')}
        >
          {step === 0 && (
            <StepName
              value={fullName}
              onChange={setFullName}
              inputRef={nameRef}
                onNext={() => advance()}
            />
          )}

          {step === 1 && (
            <StepImport
              importDone={importDone}
              importThin={importThin}
              importing={importing}
              extracting={extracting}
              importProgress={importProgress}
              importSource={importSource}
              pdfFileName={pdfFileName}
              importError={importError}
              manualMode={manualMode}
              pasteText={pasteText}
              currentTitle={currentTitle}
              currentCompany={currentCompany}
              linkedinUrl={linkedinUrl}
              onPasteText={setPasteText}
              onImport={handlePasteImport}
              onPdfClick={() => linkedinPdfRef.current?.click()}
              onManual={() => setManualMode(true)}
              onTitle={setCurrentTitle}
              onCompany={setCurrentCompany}
              onLinkedinUrl={setLinkedinUrl}
            />
          )}

          {step === 2 && (
            <StepLevel
              roleTitles={roleTitles}
              onToggle={toggleRoleTrack}
            />
          )}

          {step === 3 && (
            <StepCompanies
              names={companyNames}
              onChange={setCompanyNames}
              persona={searchPersona}
              currentTitle={currentTitle}
              targetTitles={targetTitles}
              resumeText={resumeText}
              isPassive={isPassive}
              onTitle={setCurrentTitle}
            />
          )}

          {step === 4 && (
            <StepSituation
              status={employmentStatus}
              timeline={searchTimeline}
              driver={searchDriver}
              posture={searchPosture || resolvedSearchPosture}
              onStatus={setEmploymentStatus}
              onTimeline={setSearchTimeline}
              onDriver={setSearchDriver}
              onPosture={setSearchPosture}
            />
          )}

          {step === 5 && (
            <StepBriefingTime
              value={briefingTime}
              onChange={setBriefingTime}
              emailNudgesOptIn={emailNudgesOptIn}
              onEmailNudgesOptIn={setEmailNudgesOptIn}
            />
          )}

          {step === 6 && (
            <RelationshipProgressPanel
              enrichmentStarted={enrichmentStarted}
              progress={relationshipProgress}
              contactName={contactName}
              contactTitle={contactTitle}
              contactCompanyName={contactCompanyName}
              selectedCompanyId={selectedCompanyId}
              addingContact={addingContact}
              onContactName={setContactName}
              onContactTitle={setContactTitle}
              onContactCompanyName={setContactCompanyName}
              onSelectedCompany={setSelectedCompanyId}
              onAddContact={addContactDuringEnrichment}
            />
          )}

          {step === 7 && (
            <OnboardingContextStep
              targetLocations={targetLocations}
              sectors={targetSectors}
              compensation={compPreference}
              positioning={positioningStyle}
              briefingTime={briefingTime}
              onTargetLocations={setTargetLocations}
              onSectors={setTargetSectors}
              onCompensation={setCompPreference}
              onPositioning={setPositioningStyle}
              onBriefingTime={setBriefingTime}
            />
          )}

          {step === 8 && (
            <>
              <OnboardingDoneStep
                firstName={firstName}
                  currentTitle={currentTitle}
                  currentCompany={currentCompany}
                  targetTitles={targetTitles}
                companies={companyNames.filter(n => n.trim())}
                briefingTime={briefingTime}
                isPassive={isPassive}
                intelContent={intelContent}
                intelLoading={intelLoading}
              />
              <ScanProgressPanel
                scanStarted={scanStarted}
                progress={scanProgress}
                extraCompany={extraCompany}
                addingCompany={addingCompany}
                canAddMore={companyNames.filter(n => n.trim()).length < 8}
                onExtraCompany={setExtraCompany}
                onAddCompany={addCompanyDuringScan}
              />
            </>
          )}
        </div>

        {/* Nav row */}
        <div className="mt-10 flex items-center justify-between">
          {/* Back / skip */}
          <div className="flex items-center gap-4">
            {step > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => goTo(prevStep())}
                className="h-auto p-0 !bg-transparent text-[13px] font-normal text-muted-foreground hover:text-foreground"
              >
                Back
              </Button>
            )}
            <Button
              type="submit"
              variant="ghost"
              form="onboarding-form"
              formAction={skipOnboarding}
              className="h-auto p-0 !bg-transparent text-[12px] font-normal text-muted-foreground"
            >
              Skip setup
            </Button>
          </div>

          {/* Dots */}
          <div className="flex flex-col items-center gap-2">
            <Dots current={progressIndex()} total={advancedSetup ? STEP_COUNT : QUICK_PATH_STEP_COUNT} />
            <p className="text-[11px] text-muted-foreground">
              {step <= 1
                ? 'Fast path: see your likely-to-open shortlist in minutes.'
                : step <= 4
                ? 'You are one step away from first value.'
                : step === 6
                ? 'Add one contact while enrichment maps decision paths.'
                : step === 7
                ? 'Optional context improves rankings and outreach suggestions.'
                : 'Next: launch your dashboard with relationships in motion.'}
            </p>
          </div>

          {/* Next */}
          <div>
            {step === 0 && (
              <Button
                type="button"
                onClick={() => goTo(1, false)}
                className="px-6 min-h-[44px] text-[14px] font-semibold"
              >
                Start setup
              </Button>
            )}
            {step === 1 && (
              <div className="flex flex-col items-end gap-2">
                <Button
                  type="button"
                  onClick={advance}
                  disabled={importProgress.status !== 'idle'}
                  className="px-6 min-h-[44px] text-[14px] font-semibold"
                >
                  Continue
                </Button>
                {!importDone && importProgress.status === 'idle' && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={advance}
                    className="h-auto p-0 !bg-transparent text-[12px] font-normal text-muted-foreground hover:text-foreground"
                  >
                    Skip import for now
                  </Button>
                )}
              </div>
            )}
            {step === 2 && (
              <div className="flex flex-col items-end gap-2">
                <Button
                  type="button"
                  onClick={() => goTo(3, false)}
                  disabled={roleTitles.length === 0}
                  className="px-6 min-h-[44px] text-[14px] font-semibold"
                >
                  Continue to shortlist
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => goTo(3, true)}
                  disabled={lowEnergyMode || roleTitles.length === 0}
                  className="h-auto p-0 !bg-transparent text-[12px] font-normal text-muted-foreground hover:text-foreground"
                >
                  {lowEnergyMode ? 'Context optional in low-energy mode' : 'Add search context first'}
                </Button>
              </div>
            )}
            {step === 3 && (
              <Button
                type="button"
                onClick={advance}
                disabled={!companyNames.some(n => n.trim())}
                className="px-6 min-h-[44px] text-[14px] font-semibold"
              >
                Continue
              </Button>
            )}
            {step === 4 && (
              <Button
                type="button"
                onClick={advance}
                className="px-6 min-h-[44px] text-[14px] font-semibold"
              >
                Continue
              </Button>
            )}
            {step === 5 && (
              <Button
                type="button"
                onClick={advance}
                className="px-6 min-h-[44px] text-[14px] font-semibold"
              >
                Continue
              </Button>
            )}
            {step === 6 && (
              <Button
                type="button"
                onClick={advance}
                className="px-6 min-h-[44px] text-[14px] font-semibold"
              >
                Continue
              </Button>
            )}
            {step === 7 && (
              <div className="flex flex-col items-end gap-2">
                <Button
                  type="button"
                  onClick={advance}
                  className="px-6 min-h-[44px] text-[14px] font-semibold"
                >
                  Continue
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={advance}
                  className="h-auto p-0 !bg-transparent text-[12px] font-normal text-muted-foreground hover:text-foreground"
                >
                  Skip context for now
                </Button>
              </div>
            )}
            {step === 8 && (
              <Button
                type="submit"
                form="onboarding-form"
                className="px-6 min-h-[44px] text-[14px] font-semibold"
              >
                {isPassive ? 'Start monitoring' : 'Start my search'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Input
        ref={linkedinPdfRef}
        type="file"
        accept=".pdf"
        onChange={handleLinkedInPdf}
        aria-label="Upload LinkedIn PDF"
        className="hidden"
      />
      <HelpQuickButton source="onboarding" href="/dashboard/help" />
    </div>
  )
}

function StepCompanies({
  names,
  onChange,
  persona,
  currentTitle,
  targetTitles = '',
  resumeText = '',
  isPassive,
  onTitle,
}: {
  names: string[]
  onChange: (v: string[]) => void
  persona: SearchPersona | ''
  currentTitle: string
  targetTitles?: string
  resumeText?: string
  isPassive?: boolean
  onTitle?: (v: string) => void
}) {
  const suggestions = suggestedCompaniesForProfile(persona, currentTitle, resumeText)
  const inputCls = 'w-full !border-border rounded-lg px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus-visible:!border-border !bg-background/60'
  const filled = names.filter(n => n.trim()).length
  const cooSignalContext = `${currentTitle} ${targetTitles}`.toLowerCase()
  const isCooTrack = /\bcoo\b|chief\s+operating\s+officer/.test(cooSignalContext)

  const [discovering, setDiscovering] = useState(false)
  const [discovered, setDiscovered] = useState<{ name: string; sector: string; fit: number }[] | null>(null)
  const [discoverError, setDiscoverError] = useState(false)

  async function discover() {
    setDiscovering(true)
    setDiscoverError(false)
    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            currentTitle: currentTitle || undefined,
            persona: persona || undefined,
          },
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setDiscovered(Array.isArray(data) ? data.slice(0, 9) : [])
    } catch {
      setDiscoverError(true)
    } finally {
      setDiscovering(false)
    }
  }

  function update(i: number, val: string) {
    const next = [...names]
    next[i] = val
    if (i === names.length - 1 && val.trim() && names.length < 8) next.push('')
    onChange(next)
  }

  function addName(name: string) {
    if (names.some(n => n.trim().toLowerCase() === name.toLowerCase())) return
    const emptyIdx = names.findIndex(n => !n.trim())
    if (emptyIdx >= 0) {
      const next = [...names]
      next[emptyIdx] = name
      onChange(next)
    } else {
      onChange([...names, name])
    }
  }

  function removeName(name: string) {
    const next = names.filter(n => n.trim().toLowerCase() !== name.toLowerCase())
    if (!next.some(n => !n.trim())) next.push('')
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-serif font-bold text-foreground leading-tight mb-2">
          {isPassive ? 'Which companies do you want to monitor?' : 'Which companies are you targeting?'}
        </h1>
        <p className="text-[15px] text-muted-foreground">
          {isPassive
            ? 'We scan their career pages and alert you when something worth knowing appears.'
            : 'Add at least one. We scan their career pages and alert you when a matching role appears.'}
        </p>
        <p className="text-[12px] text-muted-foreground mt-1.5">
          Why this matters: these are the companies where we help you take your place before competition sees the opening.
        </p>
        {isCooTrack && (
          <p className="text-[12px] text-primary mt-2">
            COO note: these mandates are rarely posted. Prioritize companies where you already have relationships, and watch M&amp;A and operational-announcement signals to spot mandate creation early.
          </p>
        )}
      </div>

      {isPassive && onTitle && (
        <div>
          <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
            Your current title
          </Label>
          <Input
            type="text"
            value={currentTitle}
            onChange={e => onTitle(e.target.value)}
            placeholder="Chief Information Officer"
            className={inputCls}
          />
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {names.map((name, i) => (
          <Input
            key={i}
            type="text"
            value={name}
            onChange={e => update(i, e.target.value)}
            placeholder={i === 0 ? 'Company name' : i < 3 ? 'Add another' : 'Add more'}
            className={inputCls}
          />
        ))}
      </div>

      {suggestions.length > 0 && !discovered && (
        <div>
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-2">Great choices for you</p>
          <ToggleGroup
            multiple
            value={suggestions.filter(s => names.some(n => n.trim().toLowerCase() === s.name.toLowerCase())).map(s => s.name)}
            onValueChange={(values) => {
              for (const s of suggestions) {
                const pressed = values.includes(s.name)
                const added = names.some(n => n.trim().toLowerCase() === s.name.toLowerCase())
                if (pressed && !added) addName(s.name)
                if (!pressed && added) removeName(s.name)
              }
            }}
            className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2"
          >
            {suggestions.map((s) => {
              const added = names.some(n => n.trim().toLowerCase() === s.name.toLowerCase())
              return (
                <ToggleGroupItem
                  key={s.name}
                  value={s.name}
                  className={`flex-col h-auto items-start justify-start text-left rounded border p-3 whitespace-normal transition-colors cursor-pointer ${
                    added
                      ? '!border-primary/70 !bg-primary/20 !text-foreground hover:!bg-primary/25 hover:!border-primary/30'
                      : '!border-border !bg-muted/40 !text-foreground hover:!border-border'
                  }`}
                >
                  <p className="text-[14px] font-semibold">{added ? '✓ ' : '+ '}{s.name}</p>
                  <p className={['mt-1 text-[12px] leading-relaxed', added ? 'text-foreground' : 'text-muted-foreground'].join(' ')}>{s.roleHint}</p>
                  <p className={['mt-1 text-[12px] leading-relaxed', added ? 'text-foreground' : 'text-muted-foreground'].join(' ')}>{s.why}</p>
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>
        </div>
      )}

      {/* AI Discovery */}
      {!discovered && !discovering && (
        <Button
          type="button"
          variant="ghost"
          onClick={discover}
          className="h-auto p-0 !bg-transparent justify-start text-left text-[13px] font-normal text-muted-foreground hover:text-foreground"
        >
          {discoverError ? 'Could not load suggestions - try again ->' : 'Not sure where to start? Discover companies with AI ->'}
        </Button>
      )}

      {discovering && (
        <p className="text-[13px] text-muted-foreground">Finding companies for you...</p>
      )}

      {discovered && discovered.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground">AI-suggested companies</p>
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setDiscovered(null); setDiscoverError(false) }}
              className="h-auto p-0 !bg-transparent text-[11px] font-normal text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          </div>
          <ToggleGroup
            multiple
            value={discovered.filter(co => names.some(n => n.trim().toLowerCase() === co.name.toLowerCase())).map(co => co.name)}
            onValueChange={(values) => {
              for (const co of discovered) {
                const pressed = values.includes(co.name)
                const added = names.some(n => n.trim().toLowerCase() === co.name.toLowerCase())
                if (pressed && !added) addName(co.name)
                if (!pressed && added) removeName(co.name)
              }
            }}
            className="flex flex-wrap gap-2"
          >
            {discovered.map(co => {
              const added = names.some(n => n.trim().toLowerCase() === co.name.toLowerCase())
              return (
                <ToggleGroupItem
                  key={co.name}
                  value={co.name}
                  className={`text-[13px] rounded border px-3 py-1.5 transition-colors cursor-pointer ${
                    added
                      ? '!border-primary/70 !bg-primary/20 !text-foreground hover:!bg-primary/25 hover:!border-primary/30'
                      : '!border-border !bg-muted/40 !text-foreground hover:!border-border'
                  }`}
                >
                  {added ? '\u2713 ' : '+ '}{co.name}
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>
        </div>
      )}

      <p className="text-[12px] text-muted-foreground">
        {filled === 0
          ? 'Add at least one company to continue.'
          : filled === 1
          ? 'Good start. Add 2 more for the best coverage.'
          : filled >= 3
          ? `${filled} companies added. You can add more after setup.`
          : `${filled} added. One more recommended.`}
      </p>
    </div>
  )
}

function StepBriefingTime({
  value,
  onChange,
  emailNudgesOptIn,
  onEmailNudgesOptIn,
}: {
  value: string
  onChange: (v: string) => void
  emailNudgesOptIn: boolean
  onEmailNudgesOptIn: (v: boolean) => void
}) {
  const TIMES = [
    { label: '6:00 AM', value: '06:00' },
    { label: '6:30 AM', value: '06:30' },
    { label: '7:00 AM', value: '07:00' },
    { label: '7:30 AM', value: '07:30' },
    { label: '8:00 AM', value: '08:00' },
    { label: '8:30 AM', value: '08:30' },
    { label: '9:00 AM', value: '09:00' },
  ]

  const tz = typeof window !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'your local time'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-serif font-bold text-foreground leading-tight mb-2">
          When do you want your daily briefing?
        </h1>
        <p className="text-[15px] text-muted-foreground">
          Each morning: signals from your target companies, actions due, and your search momentum - assembled overnight.
        </p>
        <p className="text-[12px] text-muted-foreground mt-1.5">
          Why this matters: consistent timing turns insight into action before opportunities cool off.
        </p>
      </div>

      <ToggleGroup
        value={value ? [value] : []}
        onValueChange={(values) => {
          if (values[0]) onChange(values[0])
        }}
        className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-3"
      >
        {TIMES.map(t => (
          <ToggleGroupItem
            key={t.value}
            value={t.value}
            className={[
              'h-auto border rounded-lg px-4 py-3.5 text-[15px] font-semibold transition-all cursor-pointer',
              value === t.value
                ? '!border-primary/70 !bg-primary/20 !text-foreground'
                : '!border-border !bg-muted/40 !text-foreground hover:!border-border',
            ].join(' ')}
          >
            {t.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <p className="text-[12px] text-muted-foreground">
        Delivered in {tz}. You can change this anytime from your profile.
      </p>

      <Card variant="glass" className="rounded-lg border-border bg-muted/40 p-4">
        <p className="text-[13px] font-semibold text-foreground mb-1">Trial tips by email - your choice</p>
        <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">
          Your search is private. Beyond your daily briefing, we only send occasional trial tips if you say yes here.
          You can change this anytime in Settings.
        </p>
        <ToggleGroup
          value={[emailNudgesOptIn ? 'yes' : 'no']}
          onValueChange={(values) => {
            if (values[0]) onEmailNudgesOptIn(values[0] === 'yes')
          }}
          aria-label="Trial tip emails"
          className="flex w-full gap-2"
        >
          <ToggleGroupItem
            value="no"
            className={[
              'h-auto flex-1 border rounded-lg px-4 py-3 min-h-[44px] text-[13px] font-semibold transition-all cursor-pointer',
              !emailNudgesOptIn
                ? '!border-primary/70 !bg-primary/20 !text-foreground'
                : '!border-border !bg-muted/40 !text-foreground hover:!border-border',
            ].join(' ')}
          >
            No thanks - briefing only
          </ToggleGroupItem>
          <ToggleGroupItem
            value="yes"
            className={[
              'h-auto flex-1 border rounded-lg px-4 py-3 min-h-[44px] text-[13px] font-semibold transition-all cursor-pointer',
              emailNudgesOptIn
                ? '!border-primary/70 !bg-primary/20 !text-foreground'
                : '!border-border !bg-muted/40 !text-foreground hover:!border-border',
            ].join(' ')}
          >
            Yes, send trial tips
          </ToggleGroupItem>
        </ToggleGroup>
      </Card>
    </div>
  )
}

function StepName({
  value,
  onChange,
  inputRef,
  onNext,
}: {
  value: string
  onChange: (v: string) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-serif font-bold text-foreground leading-tight mb-2">
          Let&apos;s find roles before the crowd sees them.
        </h1>
        <p className="text-[15px] text-muted-foreground">
          Two minutes of setup. Your first company scan starts before you finish.
        </p>
      </div>
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onNext()}
        placeholder="Your full name"
        autoComplete="name"
        className="w-full !border-border rounded-lg px-4 py-3.5 text-[16px] text-foreground placeholder:text-muted-foreground !bg-background/60"
      />
      <p className="text-[12px] text-muted-foreground">
        Add your name now or skip. Either way, we move straight to your target shortlist.
      </p>
    </div>
  )
}

function StepLevel({
  roleTitles,
  onToggle,
}: {
  roleTitles: RoleTitle[]
  onToggle: (v: RoleTrackOption) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-serif font-bold text-foreground leading-tight mb-2">
          Which role lanes are you targeting?
        </h1>
        <p className="text-[15px] text-muted-foreground">
          Choose every lane you want us to watch. Your first pick leads the workflow.
        </p>
        <p className="text-[12px] text-muted-foreground mt-1.5">
          Why this matters: we use these lanes to surface the earliest opportunities that match your next move.
        </p>
      </div>
      <ToggleGroup
        multiple
        value={roleTitles}
        onValueChange={(values) => {
          const optAdded = ROLE_TRACK_OPTIONS.find(o => values.includes(o.value) && !roleTitles.includes(o.value))
          const optRemoved = ROLE_TRACK_OPTIONS.find(o => !values.includes(o.value) && roleTitles.includes(o.value))
          const changed = optAdded ?? optRemoved
          if (changed) onToggle(changed)
        }}
        className="grid w-full grid-cols-2 gap-3"
      >
        {ROLE_TRACK_OPTIONS.map(opt => {
          const selected = roleTitles.includes(opt.value)
          const isPrimary = roleTitles[0] === opt.value
          return (
            <ToggleGroupItem
              key={opt.value}
              value={opt.value}
              className={[
                'h-auto text-left border rounded-lg px-5 py-4 flex items-center justify-between transition-all cursor-pointer',
                selected
                  ? '!border-primary/70 !bg-primary/20 !text-foreground'
                  : '!border-border !bg-muted/40 hover:!border-border',
              ].join(' ')}
            >
              <div>
                <div className="text-[15px] font-semibold text-foreground">
                  {opt.label}
                  {isPrimary && roleTitles.length > 1 && (
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">Primary</span>
                  )}
                </div>
                <div className={['text-[13px] mt-0.5', selected ? 'text-foreground' : 'text-muted-foreground'].join(' ')}>
                  {opt.sub}
                </div>
              </div>
              {selected && (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0 ml-4">
                  <circle cx="9" cy="9" r="9" fill="white" fillOpacity="0.2" />
                  <path d="M5 9l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
    </div>
  )
}

function StepSituation({
  status,
  timeline,
  driver,
  posture,
  onStatus,
  onTimeline,
  onDriver,
  onPosture,
}: {
  status: string
  timeline: string
  driver: string
  posture: string
  onStatus: (v: string) => void
  onTimeline: (v: string) => void
  onDriver: (v: string) => void
  onPosture: (v: string) => void
}) {
  const selectTriggerCls = 'w-full !border-border rounded-lg px-4 py-3.5 h-auto text-[15px] text-foreground focus-visible:!border-border !bg-background/60 cursor-pointer'
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-serif font-bold text-foreground leading-tight mb-2">
          Where are you in your search?
        </h1>
        <p className="text-[15px] text-muted-foreground">
          Helps calibrate the urgency and tone of your intelligence.
        </p>
        <p className="text-[12px] text-muted-foreground mt-1.5">
          Why this matters: we tune timing so you see what needs action now versus what can wait.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
              Current situation
            </Label>
            <Select value={status || undefined} onValueChange={(value) => onStatus(value ?? '')}>
              <SelectTrigger title="Current situation" className={selectTriggerCls}>
                <SelectValue placeholder="Select one" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employed_exploring">Employed, quietly exploring</SelectItem>
                <SelectItem value="active_search">In active search</SelectItem>
                <SelectItem value="consulting">Consulting or interim</SelectItem>
                <SelectItem value="between_roles">Between roles</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
              Timeline
            </Label>
            <Select value={timeline || undefined} onValueChange={(value) => onTimeline(value ?? '')}>
              <SelectTrigger title="Search timeline" className={selectTriggerCls}>
                <SelectValue placeholder="Select one" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediately">Need something immediately</SelectItem>
                <SelectItem value="3_months">Within 3 months</SelectItem>
                <SelectItem value="6_months">Within 6 months</SelectItem>
                <SelectItem value="opportunistic">Right opportunity only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
            What is driving this search? <span className="font-normal normal-case tracking-normal text-muted-foreground">(one sentence)</span>
          </Label>
          <Input
            type="text"
            value={driver}
            onChange={e => onDriver(e.target.value)}
            placeholder="e.g. My role was eliminated. / I want to move from VP to CIO."
            className="w-full !border-border rounded-lg px-4 py-3.5 text-[15px] text-foreground placeholder:text-muted-foreground !bg-background/60"
          />
        </div>
        <div>
          <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
            Your current posture
          </Label>
          <p className="mb-2 text-[12px] leading-relaxed text-muted-foreground">
            This changes the tone of your daily recommendation, not what we watch.
          </p>
          <ToggleGroup
            value={[posture]}
            onValueChange={(values) => { if (values[0]) onPosture(values[0]) }}
            aria-label="Search posture"
            className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3"
          >
            <ToggleGroupItem value="active" className={`h-auto min-h-[44px] rounded-lg border px-3 py-3 text-left text-[13px] font-semibold ${posture === 'active' ? '!border-primary/70 !bg-primary/20 !text-foreground' : '!border-border !bg-muted/40 !text-foreground hover:!border-border'}`}>
              Actively searching
            </ToggleGroupItem>
            <ToggleGroupItem value="exploring" className={`h-auto min-h-[44px] rounded-lg border px-3 py-3 text-left text-[13px] font-semibold ${posture === 'exploring' ? '!border-primary/70 !bg-primary/20 !text-foreground' : '!border-border !bg-muted/40 !text-foreground hover:!border-border'}`}>
              Building relationships
            </ToggleGroupItem>
            <ToggleGroupItem value="not_looking" className={`h-auto min-h-[44px] rounded-lg border px-3 py-3 text-left text-[13px] font-semibold ${posture === 'not_looking' ? '!border-primary/70 !bg-primary/20 !text-foreground' : '!border-border !bg-muted/40 !text-foreground hover:!border-border'}`}>
              Not looking now
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      <p className="text-[12px] text-muted-foreground">
        You can update this anytime from your profile.
      </p>
    </div>
  )
}

function StepImport({
  importDone,
  importThin,
  importing,
  extracting,
  importProgress,
  importSource,
  pdfFileName,
  importError,
  manualMode,
  pasteText,
  currentTitle,
  currentCompany,
  linkedinUrl,
  onPasteText,
  onImport,
  onPdfClick,
  onManual,
  onTitle,
  onCompany,
  onLinkedinUrl,
}: {
  importDone: boolean
  importThin: boolean
  importing: boolean
  extracting: boolean
  importProgress: LinkedinImportProgressState
  importSource: 'pdf' | 'text'
  pdfFileName: string
  importError: string
  manualMode: boolean
  pasteText: string
  currentTitle: string
  currentCompany: string
  linkedinUrl: string
  onPasteText: (v: string) => void
  onImport: () => void
  onPdfClick: () => void
  onManual: () => void
  onTitle: (v: string) => void
  onCompany: (v: string) => void
  onLinkedinUrl: (v: string) => void
}) {
  const inputCls = 'w-full !border-border rounded-lg px-4 py-3.5 text-[15px] text-foreground placeholder:text-muted-foreground focus-visible:!border-border !bg-background/60'

  if (importDone) {
    if (importThin) {
      return (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-[28px] font-serif font-bold text-foreground leading-tight mb-2">
              Background text saved.
            </h1>
            <p className="text-[15px] text-muted-foreground">
              We saved your profile text but could not automatically extract your title and company. Add them below so briefings and prep briefs are personalized correctly.
            </p>
          </div>
          <Alert variant="warning">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0 mt-0.5">
              <circle cx="10" cy="10" r="10" fill="var(--warning)" fillOpacity="0.2" />
              <path d="M10 6v5" stroke="var(--warning)" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="10" cy="14" r="1" fill="var(--warning)" />
            </svg>
            <AlertDescription className="text-[13px] leading-relaxed">
              Title and company not detected. Fill them in now or update your profile later.
            </AlertDescription>
          </Alert>
          <div className="flex flex-col gap-4">
            <div>
              <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                Current or most recent title
              </Label>
              <Input
                type="text"
                value={currentTitle}
                onChange={e => onTitle(e.target.value)}
                placeholder="Chief Information Officer"
                className={inputCls}
              />
            </div>
            <div>
              <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                Current or most recent company
              </Label>
              <Input
                type="text"
                value={currentCompany}
                onChange={e => onCompany(e.target.value)}
                placeholder="Acme Corp"
                className={inputCls}
              />
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-[28px] font-serif font-bold text-foreground leading-tight mb-2">
            Profile imported.
          </h1>
          <p className="text-[15px] text-muted-foreground">
            Your signals, briefings, and prep briefs are now personalized to your background. You can review and edit your profile anytime from settings.
          </p>
        </div>
        <Alert variant="success">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="10" fill="var(--success)" fillOpacity="0.2" />
            <path d="M6 10l3 3 5-5" stroke="var(--success)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <AlertDescription className="text-[14px] font-medium">LinkedIn data extracted successfully</AlertDescription>
        </Alert>
        <Card variant="glass" className="rounded-lg border-border bg-muted/40 px-5 py-4">
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1">What we learned</p>
          <p className="text-[15px] font-semibold text-foreground">{currentTitle || 'Your current title'}{currentCompany ? ` at ${currentCompany}` : ''}</p>
          <p className="text-[12px] text-muted-foreground mt-1.5">
            We will use this to tune your shortlist, role hypotheses, and first brief.
          </p>
        </Card>
      </div>
    )
  }

  if (manualMode) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-[28px] font-serif font-bold text-foreground leading-tight mb-2">
            Tell us a bit more.
          </h1>
          <p className="text-[15px] text-muted-foreground">
            You can add your full background from your profile later.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
              Current or most recent title
            </Label>
            <Input
              type="text"
              value={currentTitle}
              onChange={e => onTitle(e.target.value)}
              placeholder="Chief Information Officer"
              className={inputCls}
            />
          </div>
          <div>
            <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
              Current or most recent company
            </Label>
            <Input
              type="text"
              value={currentCompany}
              onChange={e => onCompany(e.target.value)}
              placeholder="Acme Corp"
              className={inputCls}
            />
          </div>
          <div>
            <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
              LinkedIn URL <span className="text-muted-foreground font-normal normal-case tracking-normal">optional</span>
            </Label>
            <Input
              type="url"
              value={linkedinUrl}
              onChange={e => onLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/yourname"
              className={inputCls}
            />
          </div>
        </div>
      </div>
    )
  }

  if (importProgress.status !== 'idle') {
    const fromPdf = importSource === 'pdf'
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-[28px] font-serif font-bold text-foreground leading-tight mb-2">
            Reading your LinkedIn profile.
          </h1>
          <p className="text-[15px] text-muted-foreground">
            Hang tight while we pull out your background. You will not need to retype any of it.
          </p>
        </div>
        <LinkedinImportProgress
          state={importProgress}
          fileName={fromPdf ? pdfFileName : undefined}
          stages={
            fromPdf
              ? ['Uploading and reading your PDF', 'Extracting your background']
              : ['Extracting your background']
          }
          title={{
            active: fromPdf ? 'Importing your profile' : 'Reading your profile text',
            done: 'Profile imported',
          }}
          hint={{
            active: 'This usually takes about 10 seconds. Keep this window open.',
            done: 'Your background is saved. Setting up the rest of your profile...',
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-serif font-bold text-foreground leading-tight mb-2">
          Build your profile.
        </h1>
        <p className="text-[15px] text-muted-foreground">
          Import from LinkedIn for the best experience. It fills in your background automatically.
        </p>
      </div>

      {importError && (
        <Alert variant="destructive">
          <AlertDescription className="text-[13px]">{importError}</AlertDescription>
        </Alert>
      )}

      {/* PDF tile */}
      <Card variant="glass" className="rounded-lg border-border bg-muted/40 p-5">
        <div className="text-[14px] font-semibold text-foreground">Upload your LinkedIn PDF</div>
        <div className="text-[13px] text-muted-foreground leading-relaxed">
          On your LinkedIn profile: find the <span className="font-medium text-muted-foreground">More</span> or <span className="font-medium text-muted-foreground">Resources</span> button, then choose <span className="font-medium text-muted-foreground">Save to PDF</span>.
        </div>
        <Button
          type="button"
          onClick={onPdfClick}
          disabled={extracting || importing}
          className="self-start px-5 min-h-[40px] text-[13px] font-semibold"
        >
          {extracting ? 'Reading PDF...' : importing ? 'Extracting...' : 'Upload PDF'}
        </Button>
      </Card>

      {/* Paste tile */}
      <Card variant="glass" className="rounded-lg border-border bg-muted/40 p-5">
        <div className="text-[14px] font-semibold text-foreground">Paste profile text</div>
        <div className="text-[13px] text-muted-foreground">
          Open your LinkedIn profile, press <span className="font-medium text-muted-foreground">Cmd+A</span> then <span className="font-medium text-muted-foreground">Cmd+C</span>, and paste below.
        </div>
        <Textarea
          value={pasteText}
          onChange={e => onPasteText(e.target.value)}
          placeholder="Paste your LinkedIn profile here..."
          rows={3}
          disabled={importing}
          className="w-full !border-border rounded px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground resize-none leading-relaxed !bg-background/60"
        />
        <Button
          type="button"
          onClick={onImport}
          disabled={importing || !pasteText.trim()}
          className="self-start px-5 min-h-[40px] text-[13px] font-semibold"
        >
          {importing ? 'Extracting...' : 'Extract profile'}
        </Button>
      </Card>

      <Button
        type="button"
        variant="ghost"
        onClick={onManual}
        className="h-auto p-0 !bg-transparent justify-start text-left text-[13px] font-normal text-muted-foreground hover:text-foreground"
      >
        Skip LinkedIn import. I&apos;ll enter my details manually.
      </Button>
    </div>
  )
}

