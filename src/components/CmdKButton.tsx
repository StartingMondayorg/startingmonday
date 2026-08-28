'use client'

export function CmdKButton() {
  function open(e: React.MouseEvent) {
    e.preventDefault()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
  }

  return (
    <button
      type="button"
      onClick={open}
      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold text-primary-foreground bg-primary hover:bg-primary/90 border border-border cursor-pointer transition-colors"
      aria-label="Open command palette"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      <kbd className="font-sans">⌘K</kbd>
    </button>
  )
}
