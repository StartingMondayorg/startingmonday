'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LinkedinImportProgress, type LinkedinImportProgressState } from '@/app/components/LinkedinImportProgress'

export default function ProfileLinkedinUpload() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState<LinkedinImportProgressState>({ status: 'idle' })
  const [fileName, setFileName] = useState('')

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (inputRef.current) inputRef.current.value = ''
    setStatus('uploading')
    setMessage('')
    setFileName(file.name)
    setProgress({ status: 'running', stage: 0 })

    const body = new FormData()
    body.append('file', file)

    const res = await fetch('/api/profile/upload-linkedin', { method: 'POST', body })
    const json = await res.json().catch(() => ({}))

    if (res.ok) {
      // Hold the finished bar and checkmark briefly so completion is seen, not just inferred.
      setProgress({ status: 'complete' })
      await new Promise(resolve => window.setTimeout(resolve, 1200))
      setProgress({ status: 'idle' })
      setStatus('done')
      setMessage('LinkedIn profile uploaded and extracted.')
      router.refresh()
    } else {
      setProgress({ status: 'idle' })
      setStatus('error')
      setMessage(json.detail ? `${json.error}: ${json.detail}` : (json.error ?? 'Upload failed.'))
    }
  }

  return (
    <div className="mb-2">
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <span className="text-[12px] text-slate-500 border border-slate-200 rounded px-3 py-1.5 hover:border-slate-400 transition-colors">
          {status === 'uploading' ? 'Extracting…' : 'Upload LinkedIn PDF'}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="sr-only"
          disabled={status === 'uploading'}
          onChange={handleChange}
        />
      </label>
      {progress.status !== 'idle' && (
        <div className="mt-2 max-w-md">
          <LinkedinImportProgress
            state={progress}
            tone="light"
            fileName={fileName}
            stages={['Reading your PDF and saving it to your profile']}
            title={{ active: 'Reading your LinkedIn PDF', done: 'LinkedIn profile saved' }}
            hint={{
              active: 'This usually takes about 10 seconds. Keep this page open.',
              done: 'Your profile now includes this background.',
            }}
          />
        </div>
      )}
      {message && (
        <p className={`mt-1.5 text-[12px] ${status === 'error' ? 'text-red-600' : 'text-green-700'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
