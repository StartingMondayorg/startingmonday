'use client'

import { useEffect, useState } from 'react'
import type { Diagram, DiagramCategory as Category } from './diagrams-data'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function MermaidRenderer({ code, id }: { code: string; id: string }) {
  const [svgDataUri, setSvgDataUri] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function render() {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'strict' })
        const { svg } = await mermaid.render(`mermaid-${id}`, code)
        if (!cancelled) {
          setSvgDataUri(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`)
          setError(null)
        }
      } catch (e) {
        if (!cancelled) setError(String(e))
      }
    }
    render()
    return () => { cancelled = true }
  }, [code, id])

  if (error) return <p className="text-[12px] text-red-500 p-4">Failed to render diagram: {error}</p>
  if (!svgDataUri) return <p className="text-[12px] text-slate-500 p-4">Rendering diagram...</p>
  return <img src={svgDataUri} alt="Rendered diagram" className="max-w-full h-auto p-4" />
}

export function DiagramsClient({ categories }: { categories: Category[] }) {
  const [selected, setSelected] = useState<Diagram | null>(null)

  if (selected) {
    return (
      <div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setSelected(null)}
          className="mb-4 text-orange-500 hover:text-orange-600"
        >
          ← Back to index
        </Button>
        <Card className="p-4">
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-1">{selected.category}</p>
          <h2 className="text-[16px] font-semibold text-slate-900 mb-1">{selected.title}</h2>
          <p className="text-[12px] text-slate-500 mb-4">{selected.description}</p>
          <MermaidRenderer code={selected.mermaidCode} id={selected.slug} />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {categories.map((cat) => (
        <div key={cat.label}>
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-2">{cat.label}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cat.diagrams.map((d) => (
              <button
                key={d.slug}
                type="button"
                onClick={() => setSelected(d)}
                className="text-left"
              >
                <Card className="px-3 py-3 hover:border-orange-400 hover:bg-orange-50 transition-colors">
                  <p className="text-[13px] font-semibold text-slate-900">{d.title}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{d.description}</p>
                  <p className="text-[11px] text-orange-500 mt-2">View diagram →</p>
                </Card>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
