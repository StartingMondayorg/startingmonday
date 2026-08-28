'use client'
import { useState, useRef } from 'react'
import {
  type Parsed,
  type QualityCheck,
  type Section,
  cleanResume,
  parseOutput,
  parseQualityCheck,
  gradeColor,
  atsColor,
  downloadDocx,
} from '../_utils/resume-tailor-utils'
import { Alert, AlertDescription, Badge, Button, Card, Input, Label, Tabs, TabsList, TabsTrigger, Textarea } from '@/components/ui'
type Props = {
  resumeText: string
  initialJobDescription?: string
  companyName?: string
  companyId?: string
  defaultTargetTitle?: string
}

function BulletList({ text }: { text: string }) {
  const lines = text.split('\n').filter(Boolean)
  return (
    <div className="flex flex-col gap-1.5">
      {lines.map((line, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <span className="text-muted-foreground shrink-0 mt-0.5 text-[12px]">-</span>
          <p className="text-[13px] text-muted-foreground leading-relaxed">{line.replace(/^[-*•]\s*/, '')}</p>
        </div>
      ))}
    </div>
  )
}

const SECTION_TABS: { id: Section; label: string }[] = [
  { id: 'all',      label: 'Show All' },
  { id: 'resume',   label: 'Tailored Resume' },
  { id: 'keywords', label: 'Keywords' },
  { id: 'changes',  label: 'Key Changes' },
  { id: 'quality',  label: 'Quality Check' },
]

export function ResumeTailor({ resumeText, initialJobDescription = '', companyName = '', defaultTargetTitle = '' }: Props) {
  const [jd, setJd]                   = useState(initialJobDescription)
  const [targetTitle, setTargetTitle] = useState(defaultTargetTitle)
  const [output, setOutput]           = useState('')
  const [streaming, setStreaming]     = useState(false)
  const [done, setDone]               = useState(false)
  const [error, setError]             = useState('')
  const [copied, setCopied]           = useState(false)

  const [checkRaw, setCheckRaw]               = useState('')
  const [checkStreaming, setCheckStreaming]   = useState(false)
  const [checkDone, setCheckDone]             = useState(false)
  const [checkError, setCheckError]           = useState('')

  const [activeSection, setActiveSection]     = useState<Section>('all')

  const [strengthenRaw, setStrengthenRaw]     = useState('')
  const [strengthening, setStrengthening]     = useState(false)
  const [strengthenDone, setStrengthenDone]   = useState(false)
  const [strengthenError, setStrengthenError] = useState('')
  const [strengthenCopied, setStrengthenCopied] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const bufRef   = useRef('')

  const parsedRaw = done ? parseOutput(output) : null
  const parsed = parsedRaw ? { ...parsedRaw, tailored: cleanResume(parsedRaw.tailored) } : null
  const quality = checkDone ? parseQualityCheck(checkRaw) : null
  const strengthenedResume = strengthenDone ? cleanResume(strengthenRaw) : ''

  function show(section: Exclude<Section, 'all'>) {
    return activeSection === 'all' || activeSection === section
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (streaming) return
    bufRef.current = ''
    setStreaming(true)
    setDone(false)
    setOutput('')
    setError('')
    setCopied(false)
    setCheckRaw('')
    setCheckDone(false)
    setCheckError('')
    setActiveSection('all')
    setStrengthenRaw('')
    setStrengthenDone(false)
    setStrengthenError('')
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription: jd, companyName, targetTitle }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'Something went wrong.')
        setStreaming(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let isDone = false
      while (!isDone) {
        const { value, done: d } = await reader.read()
        isDone = d
        if (value) bufRef.current += decoder.decode(value, { stream: !isDone })
      }
      setOutput(bufRef.current)
      setDone(true)
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError('Connection lost. Try again.')
    } finally {
      setStreaming(false)
    }
  }

  async function handleQualityCheck() {
    if (checkStreaming) return
    if (!parsed?.tailored) {
      setCheckError('Could not find the tailored resume. Try tailoring again.')
      return
    }
    setCheckStreaming(true)
    setCheckDone(false)
    setCheckRaw('')
    setCheckError('')

    try {
      const res = await fetch('/api/tailor/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tailoredResume: parsed.tailored, jobDescription: jd, companyName }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setCheckError(json.error ?? 'Quality check failed.')
        setCheckStreaming(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let isDone = false
      while (!isDone) {
        const { value, done: d } = await reader.read()
        isDone = d
        if (value) setCheckRaw(prev => prev + decoder.decode(value, { stream: !isDone }))
      }
      setCheckDone(true)
    } catch {
      setCheckError('Connection lost. Try again.')
    } finally {
      setCheckStreaming(false)
    }
  }

  async function handleStrengthen() {
    if (strengthening || !parsed?.tailored || !quality?.weakBullets) return
    setStrengthening(true)
    setStrengthenDone(false)
    setStrengthenRaw('')
    setStrengthenError('')

    try {
      const res = await fetch('/api/tailor/strengthen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tailoredResume: parsed.tailored,
          weakBullets: quality.weakBullets,
          jobDescription: jd,
          companyName,
        }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setStrengthenError(json.error ?? 'Strengthen failed.')
        setStrengthening(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let isDone = false
      while (!isDone) {
        const { value, done: d } = await reader.read()
        isDone = d
        if (value) setStrengthenRaw(prev => prev + decoder.decode(value, { stream: !isDone }))
      }
      setStrengthenDone(true)
    } catch {
      setStrengthenError('Connection lost. Try again.')
    } finally {
      setStrengthening(false)
    }
  }

  function handleCopy() {
    if (!parsed?.tailored) return
    navigator.clipboard.writeText(parsed.tailored)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleStrengthenCopy() {
    if (!strengthenedResume) return
    navigator.clipboard.writeText(strengthenedResume)
    setStrengthenCopied(true)
    setTimeout(() => setStrengthenCopied(false), 2000)
  }

  const canSubmit = jd.trim().length >= 100 && !streaming

  return (
    <div className="flex flex-col gap-6">

      {/* Input form */}
      <Card variant="default" className="gap-0 p-0">
        <div className="px-6 py-[18px] border-b border-border">
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Job Description</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-6 pt-5 pb-3">
            <Label className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground">
              Target title <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              type="text"
              value={targetTitle}
              onChange={e => setTargetTitle(e.target.value)}
              disabled={streaming}
              placeholder="VP of Engineering"
              className="h-auto w-full px-3 py-2.5 text-[14px]"
            />
          </div>
          <div className="px-6 pb-3">
            <Label className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground">
              Job description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={jd}
              onChange={e => setJd(e.target.value)}
              disabled={streaming}
              placeholder="Paste the full job description here..."
              rows={10}
              className="w-full px-3 py-2.5 text-[14px] resize-none leading-relaxed"
            />
          </div>
          <div className="px-6 pb-5 flex items-center justify-between gap-4">
            <span className="text-[12px] text-muted-foreground">
              {jd.length > 0 ? `${jd.length.toLocaleString()} characters` : 'Min. 100 characters'}
            </span>
            <Button type="submit" disabled={!canSubmit} className="h-auto px-5 py-2.5 text-[13px] font-semibold">
              {streaming ? 'Tailoring...' : 'Tailor my resume'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-[13px]">{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading state while streaming */}
      {streaming && !done && (
        <Card variant="default" className="p-8">
          <p className="text-[13px] text-muted-foreground animate-pulse">Tailoring your resume...</p>
        </Card>
      )}

      {/* Section tab bar */}
      {done && parsed && (
        <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as Section)}>
          <TabsList variant="line" className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
            {SECTION_TABS.map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded border border-border px-3 py-1.5 text-[12px] font-semibold data-active:border-border data-active:bg-primary data-active:text-primary-foreground"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Parsed output */}
      {done && parsed && (
        <>
          {/* Tailored resume */}
          {parsed.tailored && show('resume') && (
            <Card variant="default" className="gap-0 p-0">
              <div className="px-6 py-[18px] border-b border-border flex items-center justify-between gap-4">
                <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Tailored Resume</span>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={handleCopy} className="h-auto px-3 py-1.5 text-[12px] font-semibold">
                    {copied ? 'Copied!' : 'Copy text'}
                  </Button>
                  <Button onClick={() => downloadDocx(parsed.tailored, companyName)} className="h-auto px-3 py-1.5 text-[12px] font-semibold">
                    Download .docx
                  </Button>
                </div>
              </div>
              <div className="px-6 py-6">
                <pre className="text-[13px] text-foreground leading-relaxed whitespace-pre-wrap font-sans">{parsed.tailored}</pre>
              </div>
            </Card>
          )}

          {/* Strengthened resume (shown in resume tab too) */}
          {(strengthenDone || strengthening) && show('resume') && !(activeSection === 'quality') && (
            <Card variant="default" className="gap-0 p-0 border-success/30">
              <div className="px-6 py-[18px] border-b border-success/30 flex items-center justify-between gap-4">
                <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-success">Strengthened Resume</span>
                {strengthenDone && (
                  <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handleStrengthenCopy} className="h-auto px-3 py-1.5 text-[12px] font-semibold">
                      {strengthenCopied ? 'Copied!' : 'Copy text'}
                    </Button>
                    <Button onClick={() => downloadDocx(strengthenedResume, companyName, 'Strengthened')} className="h-auto px-3 py-1.5 text-[12px] font-semibold">
                      Download .docx
                    </Button>
                  </div>
                )}
              </div>
              <div className="px-6 py-6">
                {strengthening && <p className="text-[13px] text-muted-foreground animate-pulse">Strengthening bullets...</p>}
                {strengthenDone && <pre className="text-[13px] text-foreground leading-relaxed whitespace-pre-wrap font-sans">{strengthenedResume}</pre>}
              </div>
            </Card>
          )}

          {/* Keyword analysis */}
          {parsed.keywords && show('keywords') && (
            <Card variant="default" className="gap-0 p-0">
              <div className="px-6 py-[18px] border-b border-border">
                <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Keyword Analysis</span>
              </div>
              <div className="px-6 py-5">
                {parsed.keywords.split('\n').filter(Boolean).map((line, i) => {
                  const isPresent = line.toLowerCase().startsWith('present:')
                  const isMissing = line.toLowerCase().startsWith('missing:')
                  const label = isPresent ? 'Present' : isMissing ? 'Missing' : null
                  const content = line.replace(/^(present|missing):\s*/i, '').trim()
                  if (!label) return <p key={i} className="text-[13px] text-muted-foreground leading-relaxed">{line}</p>
                  return (
                    <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
                      <Badge variant={isPresent ? 'success' : 'warning'} className="shrink-0 mt-0.5 h-auto tracking-[0.06em] uppercase px-2 py-0.5">
                        {label}
                      </Badge>
                      <p className="text-[13px] text-muted-foreground leading-relaxed">{content}</p>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Key changes */}
          {parsed.changes && show('changes') && (
            <Card variant="default" className="gap-0 p-0">
              <div className="px-6 py-[18px] border-b border-border">
                <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Key Changes</span>
              </div>
              <div className="px-6 py-5">
                <BulletList text={parsed.changes} />
              </div>
            </Card>
          )}

          {/* Quality check section - all quality-related cards */}
          {show('quality') && (
            <>
              {/* Quality check trigger */}
              {!checkDone && !checkStreaming && (
                <Card variant="default" className="bg-muted p-6 flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-[14px] font-semibold text-foreground mb-1">Run quality check</p>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      Score this resume from three angles: ATS match, recruiter first impression, and hiring manager fit. Flags weak bullets and gaps to cover verbally.
                    </p>
                  </div>
                  <Button onClick={handleQualityCheck} className="shrink-0 h-auto px-5 py-2.5 text-[13px] font-semibold">
                    Run quality check
                  </Button>
                </Card>
              )}

              {/* Quality check streaming */}
              {checkStreaming && !checkDone && (
                <Card variant="default" className="gap-0 p-0">
                  <div className="px-6 py-[18px] border-b border-border flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Quality Check</span>
                    <span className="text-[11px] text-muted-foreground animate-pulse">Scoring...</span>
                  </div>
                  <div className="px-6 py-6">
                    <pre className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">{checkRaw}</pre>
                  </div>
                </Card>
              )}

              {/* Quality check error */}
              {checkError && (
                <Alert variant="destructive">
                  <AlertDescription className="text-[13px]">{checkError}</AlertDescription>
                </Alert>
              )}

              {/* Quality check results */}
              {checkDone && quality && (
                <>
                  {/* Score summary row */}
                  <Card variant="default" className="gap-0 p-0">
                    <div className="px-6 py-[18px] border-b border-border">
                      <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Quality Check</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border">
                      <div className="px-6 py-5 text-center">
                        <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">ATS Match</p>
                        <p className={`text-[36px] font-bold leading-none ${atsColor(parseInt(quality.atsScore || '0'))}`}>
                          {quality.atsScore || '?'}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">out of 100</p>
                      </div>
                      <div className="px-6 py-5 text-center">
                        <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">Recruiter</p>
                        {quality.recruiterGrade && (
                          <Badge className={`h-auto text-[28px] font-bold leading-none px-3 py-1 border ${gradeColor(quality.recruiterGrade)}`}>
                            {quality.recruiterGrade}
                          </Badge>
                        )}
                      </div>
                      <div className="px-6 py-5 text-center">
                        <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">Hiring Mgr</p>
                        {quality.hiringManagerGrade && (
                          <Badge className={`h-auto text-[28px] font-bold leading-none px-3 py-1 border ${gradeColor(quality.hiringManagerGrade)}`}>
                            {quality.hiringManagerGrade}
                          </Badge>
                        )}
                      </div>
                      <div className="px-6 py-5 text-center">
                        <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">6-Second Test</p>
                        {quality.sixSecondGrade && (
                          <Badge className={`h-auto text-[28px] font-bold leading-none px-3 py-1 border ${gradeColor(quality.sixSecondGrade)}`}>
                            {quality.sixSecondGrade}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* ATS detail */}
                  {quality.atsNotes && (
                    <Card variant="default" className="gap-0 p-0">
                      <div className="px-6 py-[18px] border-b border-border">
                        <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">ATS Keywords</span>
                      </div>
                      <div className="px-6 py-5">
                        {quality.atsNotes.split('\n').filter(Boolean).map((line, i) => {
                          const isPresent = line.toLowerCase().startsWith('present:')
                          const isMissing = line.toLowerCase().startsWith('missing:')
                          const label = isPresent ? 'Present' : isMissing ? 'Missing' : null
                          const content = line.replace(/^(present|missing):\s*/i, '').trim()
                          if (!label) return <p key={i} className="text-[13px] text-muted-foreground">{line}</p>
                          return (
                            <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
                              <Badge variant={isPresent ? 'success' : 'warning'} className="shrink-0 mt-0.5 h-auto tracking-[0.06em] uppercase px-2 py-0.5">
                                {label}
                              </Badge>
                              <p className="text-[13px] text-muted-foreground leading-relaxed">{content}</p>
                            </div>
                          )
                        })}
                      </div>
                    </Card>
                  )}

                  {/* Recruiter + HM notes side by side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {quality.recruiterNotes && (
                      <Card variant="default" className="gap-0 p-0">
                        <div className="px-6 py-[18px] border-b border-border flex items-center gap-3">
                          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Recruiter View</span>
                          {quality.recruiterGrade && (
                            <Badge className={`h-auto text-[11px] font-bold px-1.5 py-0.5 border ${gradeColor(quality.recruiterGrade)}`}>
                              {quality.recruiterGrade}
                            </Badge>
                          )}
                        </div>
                        <div className="px-6 py-5">
                          <BulletList text={quality.recruiterNotes} />
                        </div>
                      </Card>
                    )}
                    {quality.hiringManagerNotes && (
                      <Card variant="default" className="gap-0 p-0">
                        <div className="px-6 py-[18px] border-b border-border flex items-center gap-3">
                          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Hiring Manager View</span>
                          {quality.hiringManagerGrade && (
                            <Badge className={`h-auto text-[11px] font-bold px-1.5 py-0.5 border ${gradeColor(quality.hiringManagerGrade)}`}>
                              {quality.hiringManagerGrade}
                            </Badge>
                          )}
                        </div>
                        <div className="px-6 py-5">
                          <BulletList text={quality.hiringManagerNotes} />
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Weak bullets */}
                  {quality.weakBullets && quality.weakBullets.trim().length > 10 && (
                    <Card variant="default" className="gap-0 p-0">
                      <div className="px-6 py-[18px] border-b border-border flex items-center justify-between gap-4">
                        <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Bullets to Strengthen</span>
                        {!strengthenDone && (
                          <Button
                            onClick={handleStrengthen}
                            disabled={strengthening}
                            className="h-auto px-3 py-1.5 text-[12px] font-semibold"
                          >
                            {strengthening ? 'Rewriting...' : 'Strengthen resume'}
                          </Button>
                        )}
                        {strengthenDone && (
                          <span className="text-[11px] font-semibold text-success">Resume strengthened</span>
                        )}
                      </div>
                      <div className="px-6 py-5 flex flex-col gap-4">
                        {quality.weakBullets.split(/\n\s*\n/).filter(b => b.trim()).map((block, i) => {
                          const bulletLine = block.match(/BULLET:\s*(.+)/i)?.[1]?.trim()
                          const fixLine    = block.match(/FIX:\s*(.+)/i)?.[1]?.trim()
                          if (!bulletLine && !fixLine) return null
                          return (
                            <Card key={i} variant="default" className="gap-0 p-4 border-border">
                              {bulletLine && (
                                <p className="text-[13px] text-muted-foreground italic mb-2">&ldquo;{bulletLine}...&rdquo;</p>
                              )}
                              {fixLine && (
                                <p className="text-[13px] text-foreground leading-relaxed">{fixLine}</p>
                              )}
                            </Card>
                          )
                        })}
                      </div>
                    </Card>
                  )}

                  {/* Strengthen error */}
                  {strengthenError && (
                    <Alert variant="destructive">
                      <AlertDescription className="text-[13px]">{strengthenError}</AlertDescription>
                    </Alert>
                  )}

                  {/* Strengthened resume (shown in quality tab) */}
                  {(strengthenDone || strengthening) && (
                    <Card variant="default" className="gap-0 p-0 border-success/30">
                      <div className="px-6 py-[18px] border-b border-success/30 flex items-center justify-between gap-4">
                        <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-success">Strengthened Resume</span>
                        {strengthenDone && (
                          <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={handleStrengthenCopy} className="h-auto px-3 py-1.5 text-[12px] font-semibold">
                              {strengthenCopied ? 'Copied!' : 'Copy text'}
                            </Button>
                            <Button onClick={() => downloadDocx(strengthenedResume, companyName, 'Strengthened')} className="h-auto px-3 py-1.5 text-[12px] font-semibold">
                              Download .docx
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="px-6 py-6">
                        {strengthening && <p className="text-[13px] text-muted-foreground animate-pulse">Rewriting weak bullets...</p>}
                        {strengthenDone && <pre className="text-[13px] text-foreground leading-relaxed whitespace-pre-wrap font-sans">{strengthenedResume}</pre>}
                      </div>
                    </Card>
                  )}

                  {/* Verbal cover */}
                  {quality.verbalCover && (
                    <Alert variant="warning">
                      <AlertDescription>
                        <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-warning mb-2">Cover Verbally in the Room</p>
                        <p className="text-[12px] text-warning mb-3">These gaps cannot be fixed on paper. Address them proactively in the interview.</p>
                        <BulletList text={quality.verbalCover} />
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* 6-second test */}
                  {quality.sixSecondNotes && (
                    <Card variant="default" className="gap-0 p-0">
                      <div className="px-6 py-[18px] border-b border-border flex items-center gap-3">
                        <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">6-Second Recruiter Test</span>
                        {quality.sixSecondGrade && (
                          <Badge className={`h-auto text-[11px] font-bold px-1.5 py-0.5 border ${gradeColor(quality.sixSecondGrade)}`}>
                            {quality.sixSecondGrade}
                          </Badge>
                        )}
                      </div>
                      <div className="px-6 py-5">
                        <p className="text-[13px] text-muted-foreground leading-relaxed">{quality.sixSecondNotes}</p>
                      </div>
                    </Card>
                  )}

                  {/* Re-run / retailor */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      onClick={() => { setCheckDone(false); setCheckRaw('') }}
                      className="h-auto p-0 text-[12px] text-muted-foreground hover:bg-transparent"
                    >
                      Re-run quality check
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setDone(false)
                        setOutput('')
                        setCheckDone(false)
                        setCheckRaw('')
                        setStrengthenDone(false)
                        setStrengthenRaw('')
                        setActiveSection('all')
                      }}
                      className="h-auto p-0 text-[12px] text-muted-foreground hover:bg-transparent"
                    >
                      Update JD and retailor
                    </Button>
                  </div>
                </>
              )}
            </>
          )}

          {/* Retailor (shown in non-quality sections when check not yet run) */}
          {!checkDone && show('resume') && activeSection !== 'quality' && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                onClick={() => {
                  setDone(false)
                  setOutput('')
                  setStrengthenDone(false)
                  setStrengthenRaw('')
                  setActiveSection('all')
                }}
                className="h-auto p-0 text-[12px] text-muted-foreground hover:bg-transparent"
              >
                Update job description and retailor
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
