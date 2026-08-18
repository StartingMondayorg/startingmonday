'use client'
import { useState } from 'react'

export function SignalOutreachGate({
  signalId,
  companyName,
  action,
}: {
  signalId: string
  companyName: string | null
  action: (formData: FormData) => void | Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-[12px] font-semibold text-orange-600 hover:text-orange-800 border border-orange-200 hover:border-orange-400 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded transition-colors cursor-pointer"
      >
        Generate outreach
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2 bg-orange-50 border border-orange-100 rounded px-3 py-2.5">
      <p className="text-[12px] text-slate-700 leading-relaxed">
        This works best as a reconnect to someone who already knows you
        {companyName ? ` at ${companyName}` : ''}. Cold outreach on a signal rarely lands at this level.
      </p>
      <div className="flex items-center gap-3">
        <form action={action}>
          <input type="hidden" name="signal_id" value={signalId} />
          <button
            type="submit"
            className="text-[12px] font-semibold text-orange-700 hover:text-orange-900 border border-orange-300 hover:border-orange-500 bg-white hover:bg-orange-50 px-3 py-1 rounded transition-colors cursor-pointer"
          >
            I know someone here - generate
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-[12px] text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-0 p-0"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
