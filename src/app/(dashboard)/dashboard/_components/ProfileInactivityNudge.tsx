'use client'
import { useEffect, useRef, useState } from 'react'

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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700 px-6 py-4 flex items-center justify-between gap-4 shadow-lg">
      <p className="text-[13px] text-slate-300">
        Still with you. Save your progress so far.
      </p>
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="text-[12px] text-slate-400 hover:text-slate-200 cursor-pointer bg-transparent border-0"
        >
          Dismiss
        </button>
        <button
          type="submit"
          form={formId}
          className="bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-semibold px-5 py-2 rounded transition-colors cursor-pointer border-0"
        >
          Save and continue
        </button>
      </div>
    </div>
  )
}
