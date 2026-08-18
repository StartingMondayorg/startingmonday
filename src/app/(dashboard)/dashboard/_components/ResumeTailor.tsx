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
          <span className="text-slate-300 shrink-0 mt-0.5 text-[12px]">-</span>
          <p className="text-[13px] text-slate-700 leading-relaxed">{line.replace(/^[-*•]\s*/, '')}</p>
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
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="px-6 py-[18px] border-b border-slate-200">
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400">Job Description</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-6 pt-5 pb-3">
            <label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-1.5">
              Target title <span className="text-slate-300 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={targetTitle}
              onChange={e => setTargetTitle(e.target.value)}
              disabled={streaming}
              placeholder="VP of Engineering"
              className="w-full border border-slate-200 rounded px-3 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 disabled:opacity-60"
            />
          </div>
          <div className="px-6 pb-3">
            <label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-1.5">
              Job description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={jd}
              onChange={e => setJd(e.target.value)}
              disabled={streaming}
              placeholder="Paste the full job description here..."
              rows={10}
              className="w-full border border-slate-200 rounded px-3 py-2.5 text-[14px] text-slate-800 placeholder:text-slate-300 resize-none focus:outline-none focus:border-slate-400 leading-relaxed disabled:opacity-60"
            />
          </div>
          <div className="px-6 pb-5 flex items-center justify-between gap-4">
            <span className="text-[12px] text-slate-400">
              {jd.length > 0 ? `${jd.length.toLocaleString()} characters` : 'Min. 100 characters'}
            </span>
            <button
              type="submit"
              disabled={!canSubmit}
              className="text-[13px] font-semibold text-white bg-slate-900 hover:bg-slate-700 px-5 py-2.5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {streaming ? 'Tailoring...' : 'Tailor my resume'}
            </button>
          </div>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded px-5 py-3">
          <p className="text-[13px] text-red-700">{error}</p>
        </div>
      )}

      {/* Loading state while streaming */}
      {streaming && !done && (
        <div className="bg-white border border-slate-200 rounded p-8">
          <p className="text-[13px] text-slate-400 animate-pulse">Tailoring your resume...</p>
        </div>
      )}

      {/* Section tab bar */}
      {done && parsed && (
        <div className="flex gap-2 flex-wrap">
          {SECTION_TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`text-[12px] font-semibold px-3 py-1.5 rounded transition-colors cursor-pointer border ${
                activeSection === tab.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Parsed output */}
      {done && parsed && (
        <>
          {/* Tailored resume */}
          {parsed.tailored && show('resume') && (
            <div className="bg-white border border-slate-200 rounded overflow-hidden">
              <div className="px-6 py-[18px] border-b border-slate-200 flex items-center justify-between gap-4">
                <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400">Tailored Resume</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-[12px] font-semibold text-slate-600 border border-slate-200 rounded px-3 py-1.5 hover:border-slate-400 transition-colors cursor-pointer bg-transparent"
                  >
                    {copied ? 'Copied!' : 'Copy text'}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadDocx(parsed.tailored, companyName)}
                    className="text-[12px] font-semibold text-white bg-slate-900 hover:bg-slate-700 rounded px-3 py-1.5 transition-colors cursor-pointer border-0"
                  >
                    Download .docx
                  </button>
                </div>
              </div>
              <div className="px-6 py-6">
                <pre className="text-[13px] text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">{parsed.tailored}</pre>
              </div>
            </div>
          )}

          {/* Strengthened resume (shown in resume tab too) */}
          {(strengthenDone || strengthening) && show('resume') && !(activeSection === 'quality') && (
            <div className="bg-white border border-emerald-200 rounded overflow-hidden">
              <div className="px-6 py-[18px] border-b border-emerald-200 flex items-center justify-between gap-4">
                <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-emerald-600">Strengthened Resume</span>
                {strengthenDone && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleStrengthenCopy}
                      className="text-[12px] font-semibold text-slate-600 border border-slate-200 rounded px-3 py-1.5 hover:border-slate-400 transition-colors cursor-pointer bg-transparent"
                    >
                      {strengthenCopied ? 'Copied!' : 'Copy text'}
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadDocx(strengthenedResume, companyName, 'Strengthened')}
                      className="text-[12px] font-semibold text-white bg-slate-900 hover:bg-slate-700 rounded px-3 py-1.5 transition-colors cursor-pointer border-0"
                    >
                      Download .docx
                    </button>
                  </div>
                )}
              </div>
              <div className="px-6 py-6">
                {strengthening && <p className="text-[13px] text-slate-400 animate-pulse">Strengthening bullets...</p>}
                {strengthenDone && <pre className="text-[13px] text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">{strengthenedResume}</pre>}
              </div>
            </div>
          )}

          {/* Keyword analysis */}
          {parsed.keywords && show('keywords') && (
            <div className="bg-white border border-slate-200 rounded overflow-hidden">
              <div className="px-6 py-[18px] border-b border-slate-200">
                <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400">Keyword Analysis</span>
              </div>
              <div className="px-6 py-5">
                {parsed.keywords.split('\n').filter(Boolean).map((line, i) => {
                  const isPresent = line.toLowerCase().startsWith('present:')
                  const isMissing = line.toLowerCase().startsWith('missing:')
                  const label = isPresent ? 'Present' : isMissing ? 'Missing' : null
                  const content = line.replace(/^(present|missing):\s*/i, '').trim()
                  if (!label) return <p key={i} className="text-[13px] text-slate-600 leading-relaxed">{line}</p>
                  return (
                    <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
                      <span className={`text-[11px] font-bold tracking-[0.06em] uppercase px-2 py-0.5 rounded shrink-0 mt-0.5 ${isPresent ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                        {label}
                      </span>
                      <p className="text-[13px] text-slate-700 leading-relaxed">{content}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Key changes */}
          {parsed.changes && show('changes') && (
            <div className="bg-white border border-slate-200 rounded overflow-hidden">
              <div className="px-6 py-[18px] border-b border-slate-200">
                <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400">Key Changes</span>
              </div>
              <div className="px-6 py-5">
                <BulletList text={parsed.changes} />
              </div>
            </div>
          )}

          {/* Quality check section - all quality-related cards */}
          {show('quality') && (
            <>
              {/* Quality check trigger */}
              {!checkDone && !checkStreaming && (
                <div className="bg-slate-50 border border-slate-200 rounded p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-[14px] font-semibold text-slate-900 mb-1">Run quality check</p>
                    <p className="text-[13px] text-slate-500 leading-relaxed">
                      Score this resume from three angles: ATS match, recruiter first impression, and hiring manager fit. Flags weak bullets and gaps to cover verbally.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleQualityCheck}
                    className="shrink-0 text-[13px] font-semibold text-white bg-slate-900 hover:bg-slate-700 px-5 py-2.5 rounded transition-colors cursor-pointer border-0"
                  >
                    Run quality check
                  </button>
                </div>
              )}

              {/* Quality check streaming */}
              {checkStreaming && !checkDone && (
                <div className="bg-white border border-slate-200 rounded overflow-hidden">
                  <div className="px-6 py-[18px] border-b border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400">Quality Check</span>
                    <span className="text-[11px] text-slate-400 animate-pulse">Scoring...</span>
                  </div>
                  <div className="px-6 py-6">
                    <pre className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap font-sans">{checkRaw}</pre>
                  </div>
                </div>
              )}

              {/* Quality check error */}
              {checkError && (
                <div className="bg-red-50 border border-red-200 rounded px-5 py-3">
                  <p className="text-[13px] text-red-700">{checkError}</p>
                </div>
              )}

              {/* Quality check results */}
              {checkDone && quality && (
                <>
                  {/* Score summary row */}
                  <div className="bg-white border border-slate-200 rounded overflow-hidden">
                    <div className="px-6 py-[18px] border-b border-slate-200">
                      <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400">Quality Check</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100">
                      <div className="px-6 py-5 text-center">
                        <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-2">ATS Match</p>
                        <p className={`text-[36px] font-bold leading-none ${atsColor(parseInt(quality.atsScore || '0'))}`}>
                          {quality.atsScore || '?'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">out of 100</p>
                      </div>
                      <div className="px-6 py-5 text-center">
                        <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-2">Recruiter</p>
                        {quality.recruiterGrade && (
                          <span className={`inline-block text-[28px] font-bold leading-none px-3 py-1 rounded border ${gradeColor(quality.recruiterGrade)}`}>
                            {quality.recruiterGrade}
                          </span>
                        )}
                      </div>
                      <div className="px-6 py-5 text-center">
                        <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-2">Hiring Mgr</p>
                        {quality.hiringManagerGrade && (
                          <span className={`inline-block text-[28px] font-bold leading-none px-3 py-1 rounded border ${gradeColor(quality.hiringManagerGrade)}`}>
                            {quality.hiringManagerGrade}
                          </span>
                        )}
                      </div>
                      <div className="px-6 py-5 text-center">
                        <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-2">6-Second Test</p>
                        {quality.sixSecondGrade && (
                          <span className={`inline-block text-[28px] font-bold leading-none px-3 py-1 rounded border ${gradeColor(quality.sixSecondGrade)}`}>
                            {quality.sixSecondGrade}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ATS detail */}
                  {quality.atsNotes && (
                    <div className="bg-white border border-slate-200 rounded overflow-hidden">
                      <div className="px-6 py-[18px] border-b border-slate-200">
                        <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400">ATS Keywords</span>
                      </div>
                      <div className="px-6 py-5">
                        {quality.atsNotes.split('\n').filter(Boolean).map((line, i) => {
                          const isPresent = line.toLowerCase().startsWith('present:')
                          const isMissing = line.toLowerCase().startsWith('missing:')
                          const label = isPresent ? 'Present' : isMissing ? 'Missing' : null
                          const content = line.replace(/^(present|missing):\s*/i, '').trim()
                          if (!label) return <p key={i} className="text-[13px] text-slate-600">{line}</p>
                          return (
                            <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
                              <span className={`text-[11px] font-bold tracking-[0.06em] uppercase px-2 py-0.5 rounded shrink-0 mt-0.5 ${isPresent ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                {label}
                              </span>
                              <p className="text-[13px] text-slate-700 leading-relaxed">{content}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recruiter + HM notes side by side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {quality.recruiterNotes && (
                      <div className="bg-white border border-slate-200 rounded overflow-hidden">
                        <div className="px-6 py-[18px] border-b border-slate-200 flex items-center gap-3">
                          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400">Recruiter View</span>
                          {quality.recruiterGrade && (
                            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${gradeColor(quality.recruiterGrade)}`}>
                              {quality.recruiterGrade}
                            </span>
                          )}
                        </div>
                        <div className="px-6 py-5">
                          <BulletList text={quality.recruiterNotes} />
                        </div>
                      </div>
                    )}
                    {quality.hiringManagerNotes && (
                      <div className="bg-white border border-slate-200 rounded overflow-hidden">
                        <div className="px-6 py-[18px] border-b border-slate-200 flex items-center gap-3">
                          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400">Hiring Manager View</span>
                          {quality.hiringManagerGrade && (
                            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${gradeColor(quality.hiringManagerGrade)}`}>
                              {quality.hiringManagerGrade}
                            </span>
                          )}
                        </div>
                        <div className="px-6 py-5">
                          <BulletList text={quality.hiringManagerNotes} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Weak bullets */}
                  {quality.weakBullets && quality.weakBullets.trim().length > 10 && (
                    <div className="bg-white border border-slate-200 rounded overflow-hidden">
                      <div className="px-6 py-[18px] border-b border-slate-200 flex items-center justify-between gap-4">
                        <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400">Bullets to Strengthen</span>
                        {!strengthenDone && (
                          <button
                            type="button"
                            onClick={handleStrengthen}
                            disabled={strengthening}
                            className="text-[12px] font-semibold text-white bg-slate-900 hover:bg-slate-700 px-3 py-1.5 rounded transition-colors cursor-pointer border-0 disabled:opacity-40"
                          >
                            {strengthening ? 'Rewriting...' : 'Strengthen resume'}
                          </button>
                        )}
                        {strengthenDone && (
                          <span className="text-[11px] font-semibold text-emerald-600">Resume strengthened</span>
                        )}
                      </div>
                      <div className="px-6 py-5 flex flex-col gap-4">
                        {quality.weakBullets.split(/\n\s*\n/).filter(b => b.trim()).map((block, i) => {
                          const bulletLine = block.match(/BULLET:\s*(.+)/i)?.[1]?.trim()
                          const fixLine    = block.match(/FIX:\s*(.+)/i)?.[1]?.trim()
                          if (!bulletLine && !fixLine) return null
                          return (
                            <div key={i} className="border border-slate-100 rounded p-4">
                              {bulletLine && (
                                <p className="text-[13px] text-slate-500 italic mb-2">&ldquo;{bulletLine}...&rdquo;</p>
                              )}
                              {fixLine && (
                                <p className="text-[13px] text-slate-900 leading-relaxed">{fixLine}</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Strengthen error */}
                  {strengthenError && (
                    <div className="bg-red-50 border border-red-200 rounded px-5 py-3">
                      <p className="text-[13px] text-red-700">{strengthenError}</p>
                    </div>
                  )}

                  {/* Strengthened resume (shown in quality tab) */}
                  {(strengthenDone || strengthening) && (
                    <div className="bg-white border border-emerald-200 rounded overflow-hidden">
                      <div className="px-6 py-[18px] border-b border-emerald-200 flex items-center justify-between gap-4">
                        <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-emerald-600">Strengthened Resume</span>
                        {strengthenDone && (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={handleStrengthenCopy}
                              className="text-[12px] font-semibold text-slate-600 border border-slate-200 rounded px-3 py-1.5 hover:border-slate-400 transition-colors cursor-pointer bg-transparent"
                            >
                              {strengthenCopied ? 'Copied!' : 'Copy text'}
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadDocx(strengthenedResume, companyName, 'Strengthened')}
                              className="text-[12px] font-semibold text-white bg-slate-900 hover:bg-slate-700 rounded px-3 py-1.5 transition-colors cursor-pointer border-0"
                            >
                              Download .docx
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="px-6 py-6">
                        {strengthening && <p className="text-[13px] text-slate-400 animate-pulse">Rewriting weak bullets...</p>}
                        {strengthenDone && <pre className="text-[13px] text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">{strengthenedResume}</pre>}
                      </div>
                    </div>
                  )}

                  {/* Verbal cover */}
                  {quality.verbalCover && (
                    <div className="bg-amber-50 border border-amber-200 rounded overflow-hidden">
                      <div className="px-6 py-[18px] border-b border-amber-200">
                        <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-amber-700">Cover Verbally in the Room</span>
                      </div>
                      <div className="px-6 py-5">
                        <p className="text-[12px] text-amber-700 mb-3">These gaps cannot be fixed on paper. Address them proactively in the interview.</p>
                        <BulletList text={quality.verbalCover} />
                      </div>
                    </div>
                  )}

                  {/* 6-second test */}
                  {quality.sixSecondNotes && (
                    <div className="bg-white border border-slate-200 rounded overflow-hidden">
                      <div className="px-6 py-[18px] border-b border-slate-200 flex items-center gap-3">
                        <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400">6-Second Recruiter Test</span>
                        {quality.sixSecondGrade && (
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${gradeColor(quality.sixSecondGrade)}`}>
                            {quality.sixSecondGrade}
                          </span>
                        )}
                      </div>
                      <div className="px-6 py-5">
                        <p className="text-[13px] text-slate-700 leading-relaxed">{quality.sixSecondNotes}</p>
                      </div>
                    </div>
                  )}

                  {/* Re-run / retailor */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => { setCheckDone(false); setCheckRaw('') }}
                      className="text-[12px] text-slate-400 hover:text-slate-700 transition-colors cursor-pointer bg-transparent border-0"
                    >
                      Re-run quality check
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDone(false)
                        setOutput('')
                        setCheckDone(false)
                        setCheckRaw('')
                        setStrengthenDone(false)
                        setStrengthenRaw('')
                        setActiveSection('all')
                      }}
                      className="text-[12px] text-slate-400 hover:text-slate-700 transition-colors cursor-pointer bg-transparent border-0"
                    >
                      Update JD and retailor
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* Retailor (shown in non-quality sections when check not yet run) */}
          {!checkDone && show('resume') && activeSection !== 'quality' && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setDone(false)
                  setOutput('')
                  setStrengthenDone(false)
                  setStrengthenRaw('')
                  setActiveSection('all')
                }}
                className="text-[12px] text-slate-400 hover:text-slate-700 transition-colors cursor-pointer bg-transparent border-0"
              >
                Update job description and retailor
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
