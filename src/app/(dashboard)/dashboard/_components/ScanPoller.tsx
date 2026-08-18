'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Calls router.refresh() on an interval while `active` is true.
// Used to surface immediate scan results without a full page reload.
export function ScanPoller({ active }: { active: boolean }) {
  const router = useRouter()
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => router.refresh(), 8000)
    return () => clearInterval(id)
  }, [active, router])
  return null
}
