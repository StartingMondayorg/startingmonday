'use client'

import { useState } from 'react'
import type { CoachMicroProductDeliverable } from '@/app/(marketing)/for-coaches/micro-products/product-data'
import { Button, Card, Dialog, DialogContent, DialogHeader, DialogTitle, Label } from '@/components/ui'
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

  function goToPrevious() {
    if (!canGoPrevious) return
    setSelectedIndex((prev) => prev - 1)
  }

  function goToNext() {
    if (!canGoNext) return
    setSelectedIndex((prev) => prev + 1)
  }

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
            <Card key={item.title} className="px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[15px] font-semibold text-foreground">{item.title}</p>
                  <p className="text-[12px] mt-1 text-muted-foreground">Open a brief filled-out example for this item.</p>
                </div>
                <Button
                  type="button"
                  onClick={() => openPreview(index)}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full"
                >
                  {isSelected ? 'Preview this item' : 'Show preview'}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl" showCloseButton={false}>
          <DialogHeader className="flex-row items-center justify-between gap-4 border-b pb-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-primary">{selectedItem.exampleLabel}</p>
              <DialogTitle className="text-[18px] font-bold text-foreground mt-1">{selectedItem.previewTitle}</DialogTitle>
              <p className="text-[13px] text-muted-foreground mt-1">{selectedItem.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={goToPrevious}
                disabled={!canGoPrevious}
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                Previous
              </Button>
              <Button
                type="button"
                onClick={goToNext}
                disabled={!canGoNext}
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                Next
              </Button>
              <Button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                Close
              </Button>
            </div>
          </DialogHeader>

          <Card className="bg-gradient-to-br from-primary to-muted p-4 shadow-sm">
            <div className="space-y-3">
              {selectedItem.previewLines.map((line) => {
                const field = splitPreviewLine(line)

                return (
                  <Card key={line} className="px-3 py-3">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-1">
                      {field.label}
                    </Label>
                    <div className="rounded-lg border border-border bg-muted px-3 py-2 text-[13px] text-muted-foreground leading-relaxed">
                      {field.value}
                    </div>
                  </Card>
                )
              })}
            </div>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  )
}
