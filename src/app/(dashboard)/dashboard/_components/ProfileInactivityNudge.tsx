'use client'
import { useEffect, useRef, useState } from 'react'
import { Button, Card } from '@/components/ui'
export function ProfileInactivityNudge({ formId }: { formId: string }) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const form = document.getElementById(formId)
    if (!form) return

    function resetTimer() {
      setVisible(false)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setVisible(true), 90_000)
    }

    resetTimer()
    form.addEventListener('input', resetTimer)
    form.addEventListener('change', resetTimer)
    form.addEventListener('focus', resetTimer, true)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      form.removeEventListener('input', resetTimer)
      form.removeEventListener('change', resetTimer)
      form.removeEventListener('focus', resetTimer, true)
    }
  }, [formId])

  if (!visible) return null

  return (
    <Card
      variant="glass"
      className="fixed bottom-0 left-0 right-0 z-50 rounded-none border-x-0 border-b-0 px-6 py-4 flex-row items-center justify-between gap-4 shadow-lg"
    >
      <p className="text-[13px] text-muted-foreground">
        Still with you. Save your progress so far.
      </p>
      <div className="flex items-center gap-3 shrink-0">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setVisible(false)}
          className="text-[12px] text-muted-foreground"
        >
          Dismiss
        </Button>
        <Button type="submit" form={formId} className="text-[13px] px-5 py-2 h-auto">
          Save and continue
        </Button>
      </div>
    </Card>
  )
}
