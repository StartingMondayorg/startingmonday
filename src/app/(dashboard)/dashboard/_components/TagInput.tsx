'use client'
import { useRef, useState, useEffect } from 'react'

interface TagInputProps {
  name?: string
  id?: string
  placeholder?: string
  defaultValue?: string
  value?: string
  onChange?: (val: string) => void
  required?: boolean
}

function splitTags(s: string): string[] {
  return s.split(',').map(t => t.trim()).filter(Boolean)
}

export function TagInput({ name, id, placeholder, defaultValue, value, onChange, required = false }: TagInputProps) {
  const controlled = value !== undefined
  const [tags, setTags] = useState<string[]>(() => splitTags(controlled ? (value ?? '') : (defaultValue ?? '')))
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (controlled) {
      const next = splitTags(value!)
      setTags(prev => prev.join(',') === next.join(',') ? prev : next)
    }
  }, [controlled, value])

  function applyTags(next: string[]) {
    setTags(next)
    onChange?.(next.join(', '))
  }

  function commit(raw: string) {
    const tag = raw.trim()
    if (!tag) return
    applyTags(tags.includes(tag) ? tags : [...tags, tag])
    setText('')
  }

  function remove(i: number) {
    applyTags(tags.filter((_, j) => j !== i))
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit(text)
    } else if (e.key === 'Backspace' && !text && tags.length) {
      remove(tags.length - 1)
    }
  }

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    if (v.endsWith(',')) {
      commit(v.slice(0, -1))
    } else {
      setText(v)
    }
  }

  return (
    <div
      className="flex flex-wrap gap-1.5 items-center min-h-[42px] border border-slate-200 rounded px-3 py-2 focus-within:border-slate-400 cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {name && <input type="hidden" name={name} value={tags.join(', ')} readOnly />}
      {required && (
        <input
          type="text"
          value={tags.join(', ')}
          readOnly
          required
          aria-hidden="true"
          tabIndex={-1}
          className="sr-only"
        />
      )}
      {tags.map((t, i) => (
        <span key={i} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[12px] font-medium px-2.5 py-1 rounded-full">
          {t}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); remove(i) }}
            className="text-slate-400 hover:text-slate-700 bg-transparent border-0 cursor-pointer p-0 leading-none ml-0.5"
            aria-label={`Remove ${t}`}
          >
            &times;
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={text}
        onChange={onInput}
        onKeyDown={onKey}
        onBlur={() => commit(text)}
        placeholder={tags.length === 0 ? placeholder : undefined}
        className="flex-1 min-w-[120px] text-[14px] text-slate-900 placeholder:text-slate-300 border-0 outline-none bg-transparent p-0"
      />
    </div>
  )
}
