'use client'
import { useState } from 'react'
import { Button, Card, Input } from '@/components/ui'
export function InviteClient({
  userId,
  existingUrl,
  referralCount,
  firstName,
}: {
  userId: string
  existingUrl: string | null
  referralCount: number
  firstName: string | null
}) {
  const [url, setUrl] = useState(existingUrl)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function getLink() {
    if (url) return
    setLoading(true)
    try {
      const res = await fetch('/api/invite')
      const data = await res.json()
      if (data.url) setUrl(data.url)
    } finally {
      setLoading(false)
    }
  }

  async function copyLink() {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="p-6 mb-6">
      <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-4">Your invite link</p>

      {url ? (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Input
              readOnly
              value={url}
              title="Your invite link"
              aria-label="Your invite link"
              className="flex-1 text-[13px] text-muted-foreground bg-muted"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={copyLink}
              className="shrink-0 text-[13px] font-semibold"
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>

          {referralCount > 0 && (
            <p className="text-[13px] text-muted-foreground">
              <span className="font-semibold text-muted-foreground">{referralCount}</span>{' '}
              {referralCount === 1 ? 'person has' : 'people have'} signed up through your link.
            </p>
          )}

          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground">Share via</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="text-[12px] font-semibold text-muted-foreground"
                render={<a href={`mailto:?subject=You should check out Starting Monday&body=I've been using Starting Monday to run my executive search - it monitors target companies, surfaces roles before they're posted, and generates prep briefs in about a minute. Thought you'd find it useful.%0A%0A${encodeURIComponent(url)}`} />}
              >
                Email
              </Button>
              <Button
                variant="outline"
                className="text-[12px] font-semibold text-muted-foreground"
                render={<a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" />}
              >
                LinkedIn
              </Button>
              <Button
                variant="outline"
                className="text-[12px] font-semibold text-muted-foreground"
                render={<a href={`https://twitter.com/intent/tweet?text=I've been using Starting Monday for my executive search - monitors target companies and generates prep briefs in about a minute.&url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" />}
              >
                X / Twitter
              </Button>
            </div>
          </div>
        </>
      ) : (
        <Button
          type="button"
          onClick={getLink}
          disabled={loading}
          className="text-[13px] font-semibold"
        >
          {loading ? 'Generating…' : 'Generate my invite link'}
        </Button>
      )}
    </Card>
  )
}
