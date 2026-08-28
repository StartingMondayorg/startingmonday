'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
export default function ProfileResumeUpload() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Clear input now so the same file can be re-selected after an error
    if (inputRef.current) inputRef.current.value = ''
    setStatus('uploading')
    setMessage('')

    const body = new FormData()
    body.append('file', file)

    const res = await fetch('/api/profile/upload-resume', { method: 'POST', body })
    const json = await res.json().catch(() => ({}))

    if (res.ok) {
      setStatus('done')
      setMessage('Resume extracted - text populated below.')
      router.refresh()
    } else {
      setStatus('error')
      setMessage(json.detail ? `${json.error}: ${json.detail}` : (json.error ?? 'Upload failed.'))
    }
  }

  return (
    <div className="mb-2">
      <Button variant="outline" render={<label className="cursor-pointer" />}>
        {status === 'uploading' ? 'Extracting…' : 'Upload PDF or DOCX'}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="sr-only"
          disabled={status === 'uploading'}
          onChange={handleChange}
        />
      </Button>
      {message && (
        <p className={`mt-1.5 text-[12px] ${status === 'error' ? 'text-destructive' : 'text-success'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
