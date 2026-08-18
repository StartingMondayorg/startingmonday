'use client'

import { useEffect, useMemo, useState } from 'react'

export function BackToTop() {
  const [visible, setVisible] = useState(false)
  const [hideNearFooter, setHideNearFooter] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduceMotion(media.matches)
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = window.requestAnimationFrame(() => {
        raf = 0
        setVisible(window.scrollY > window.innerHeight * 2)
      })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      if (raf) window.cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useEffect(() => {
    const footer = document.getElementById('dashboard-footer')
    if (!footer) return
    const observer = new IntersectionObserver(
      (entries) => setHideNearFooter(entries[0]?.isIntersecting ?? false),
      { threshold: 0.12 },
    )
    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  const className = useMemo(
    () => [
      'fixed right-4 sm:right-6 z-40 rounded-full border border-white/15 bg-slate-950/80 backdrop-blur px-3 py-2',
      'text-[12px] text-slate-200 hover:border-white/35 transition-all',
      'bottom-32 sm:bottom-16 md:bottom-8',
      visible && !hideNearFooter ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none',
    ].join(' '),
    [hideNearFooter, visible],
  )

  return (
    <button
      type="button"
      aria-label="Back to top"
      className={className}
      onClick={() => {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
      }}
    >
      ↑ Top
    </button>
  )
}
