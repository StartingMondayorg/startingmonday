'use client'

import { useEffect } from 'react'
import { useState } from 'react'
import type { CoachMicroProductDeliverable } from '@/app/(marketing)/for-coaches/micro-products/product-data'

type Props = {
  deliverables: CoachMicroProductDeliverable[]
}

function splitPreviewLine(line: string) {
  const separatorIndex = line.indexOf(':')

  if (separatorIndex === -1) {
    return {
      label: 'Example',
      value: line,
    }
  }

  return {
    label: line.slice(0, separatorIndex),
    value: line.slice(separatorIndex + 1).trim(),
  }
}

export function CoachDeliverablePreviewTabs({ deliverables }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  function openPreview(index: number) {
    setSelectedIndex(index)
    setIsPreviewOpen(true)
  }

  function closePreview() {
    setIsPreviewOpen(false)
  }

  function goToPrevious() {
    if (!canGoPrevious) return
    setSelectedIndex((prev) => prev - 1)
  }

  function goToNext() {
    if (!canGoNext) return
    setSelectedIndex((prev) => prev + 1)
  }

  useEffect(() => {
    if (!isPreviewOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closePreview()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPreviewOpen])

  if (deliverables.length === 0) return null

  const selectedItem = deliverables[selectedIndex] ?? deliverables[0]
  const canGoPrevious = selectedIndex > 0
  const canGoNext = selectedIndex < deliverables.length - 1

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3">
        {deliverables.map((item, index) => {
          const isSelected = index === selectedIndex

          return (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[15px] font-semibold text-slate-900">{item.title}</p>
                  <p className="text-[12px] mt-1 text-slate-500">Open a brief filled-out example for this item.</p>
                </div>
                <button
                  type="button"
                  onClick={() => openPreview(index)}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-700'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {isSelected ? 'Preview this item' : 'Show preview'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {isPreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
          onClick={closePreview}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500">{selectedItem.exampleLabel}</p>
                <h3 className="text-[18px] font-bold text-slate-900 mt-1">{selectedItem.previewTitle}</h3>
                <p className="text-[13px] text-slate-500 mt-1">{selectedItem.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPrevious}
                  disabled={!canGoPrevious}
                  className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-[12px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={goToNext}
                  disabled={!canGoNext}
                  className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-[12px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={closePreview}
                  className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-[12px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-5">
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
                <div className="space-y-3">
                  {selectedItem.previewLines.map((line) => {
                    const field = splitPreviewLine(line)

                    return (
                      <div key={line} className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1">
                          {field.label}
                        </label>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-700 leading-relaxed">
                          {field.value}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}