'use client'

import { useState } from 'react'
import { Alert, AlertDescription, Button, Card, Input, Label } from '@/components/ui'
export function SecurityClient({ accountEmail }: { accountEmail: string }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json() as { ok?: boolean; error?: string; message?: string }

      if (!response.ok || !data.ok) {
        setError(data.error || 'Could not save password.')
        setLoading(false)
        return
      }

      setPassword('')
      setConfirmPassword('')
      setSuccess(data.message || 'Password saved successfully.')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <h2 className="text-[20px] font-bold text-foreground">Security</h2>
      <p className="text-[13px] text-muted-foreground mt-1">
        Add or change your password for <span className="font-semibold text-muted-foreground">{accountEmail}</span>.
      </p>
      <p className="text-[13px] text-muted-foreground mt-1.5">
        If you originally signed up with Google or Apple, this links a password so you can sign in either way.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 max-w-md">
        <div>
          <Label htmlFor="new-password" className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
            New password
          </Label>
          <Input
            id="new-password"
            name="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full"
          />
        </div>

        <div>
          <Label htmlFor="confirm-password" className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
            Confirm password
          </Label>
          <Input
            id="confirm-password"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="w-full"
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert variant="success">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? 'Saving...' : 'Save password'}
        </Button>
      </form>
    </Card>
  )
}
