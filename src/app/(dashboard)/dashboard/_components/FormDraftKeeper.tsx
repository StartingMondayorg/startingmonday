'use client'
import { useEffect, useRef, useState } from 'react'
import { Alert, AlertDescription, Button } from '@/components/ui'
import { draftDiffers, parseDraft, serializeDraft, type DraftField, type FormDraft } from './form-draft'

type FieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

function collect(form: HTMLFormElement): DraftField[] {
  const out: DraftField[] = []
  form.querySelectorAll<FieldElement>('input, textarea, select').forEach(el => {
    out.push({ name: el.name, type: el instanceof HTMLInputElement ? el.type : el.tagName.toLowerCase(), value: el.value, checked: el instanceof HTMLInputElement ? el.checked : undefined })
  })
  return out
}

function apply(form: HTMLFormElement, draft: FormDraft) {
  form.querySelectorAll<FieldElement>('input, textarea, select').forEach(el => {
    if (!(el.name in draft)) return
    const value = draft[el.name]
    if (el instanceof HTMLInputElement && el.type === 'checkbox') {
      el.checked = Array.isArray(value) && value.includes(el.value)
    } else if (el instanceof HTMLInputElement && el.type === 'radio') {
      el.checked = value === el.value
    } else if (typeof value === 'string') {
      el.value = value
    }
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

// Replaces the 90-second "Still with you. Save your progress." bar (retired under R-1):
// unsaved edits are kept in sessionStorage and offered back after a reload or
// accidental navigation. Nothing is written to the server until the user saves.
export function FormDraftKeeper({ formId, storageKey }: { formId: string; storageKey: string }) {
  const [restored, setRestored] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null
    if (!form) return

    const saved = parseDraft(sessionStorage.getItem(storageKey))
    let restoreTimer: ReturnType<typeof setTimeout> | null = null
    if (saved && draftDiffers(saved, serializeDraft(collect(form)))) {
      apply(form, saved)
      restoreTimer = setTimeout(() => setRestored(true), 0)
    }

    function persist() {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(serializeDraft(collect(form!))))
        } catch {
          /* storage full or unavailable: the Save button still works */
        }
      }, 400)
    }
    function clear() {
      if (timer.current) clearTimeout(timer.current)
      sessionStorage.removeItem(storageKey)
    }

    form.addEventListener('input', persist)
    form.addEventListener('change', persist)
    form.addEventListener('submit', clear)
    return () => {
      if (timer.current) clearTimeout(timer.current)
      if (restoreTimer) clearTimeout(restoreTimer)
      form.removeEventListener('input', persist)
      form.removeEventListener('change', persist)
      form.removeEventListener('submit', clear)
    }
  }, [formId, storageKey])

  if (!restored) return null

  return (
    <Alert className="mt-4 max-w-xl flex-row items-center justify-between gap-3" data-testid="form-draft-restored">
      <AlertDescription className="text-[12px] text-muted-foreground">
        We restored edits you had not saved yet. Save the profile to keep them.
      </AlertDescription>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="shrink-0"
        onClick={() => {
          sessionStorage.removeItem(storageKey)
          window.location.reload()
        }}
      >
        Discard
      </Button>
    </Alert>
  )
}
