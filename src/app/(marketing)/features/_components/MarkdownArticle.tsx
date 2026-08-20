import type { ReactNode } from 'react'

type Block =
  | { type: 'h1' | 'h2' | 'h3'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'table'; rows: string[][] }
  | { type: 'divider' }

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.split(/\r?\n/)
  const blocks: Block[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i]?.trim() ?? ''

    if (!line) {
      i += 1
      continue
    }

    if (/^---+$/.test(line)) {
      blocks.push({ type: 'divider' })
      i += 1
      continue
    }

    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.replace(/^###\s+/, '').trim() })
      i += 1
      continue
    }

    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.replace(/^##\s+/, '').trim() })
      i += 1
      continue
    }

    if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', text: line.replace(/^#\s+/, '').trim() })
      i += 1
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test((lines[i] ?? '').trim())) {
        items.push((lines[i] ?? '').trim().replace(/^[-*]\s+/, '').trim())
        i += 1
      }
      blocks.push({ type: 'list', ordered: false, items })
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test((lines[i] ?? '').trim())) {
        items.push((lines[i] ?? '').trim().replace(/^\d+\.\s+/, '').trim())
        i += 1
      }
      blocks.push({ type: 'list', ordered: true, items })
      continue
    }

    if (line.includes('|')) {
      const rows: string[][] = []
      while (i < lines.length && (lines[i] ?? '').includes('|')) {
        const raw = (lines[i] ?? '').trim()
        const isSeparator = /^\|?\s*[-:]+(?:\s*\|\s*[-:]+)+\s*\|?$/.test(raw)
        if (!isSeparator) {
          const cells = raw
            .split('|')
            .map((cell) => cell.trim())
            .filter((cell, idx, arr) => !(idx === 0 && cell === '') && !(idx === arr.length - 1 && cell === ''))
          if (cells.length > 0) rows.push(cells)
        }
        i += 1
      }
      if (rows.length > 0) blocks.push({ type: 'table', rows })
      continue
    }

    const paragraph: string[] = [line]
    i += 1
    while (i < lines.length) {
      const next = (lines[i] ?? '').trim()
      if (!next) break
      if (
        next.startsWith('# ') ||
        next.startsWith('## ') ||
        next.startsWith('### ') ||
        /^[-*]\s+/.test(next) ||
        /^\d+\.\s+/.test(next) ||
        next.includes('|') ||
        /^---+$/.test(next)
      ) {
        break
      }
      paragraph.push(next)
      i += 1
    }

    blocks.push({ type: 'paragraph', text: paragraph.join(' ') })
  }

  return blocks
}

function renderInline(text: string, keyBase: string): ReactNode[] {
  const output: ReactNode[] = []
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g
  let last = 0
  let match: RegExpExecArray | null = regex.exec(text)

  while (match) {
    const [full, label, href] = match
    const index = match.index
    if (index > last) output.push(text.slice(last, index))

    output.push(
      <a key={`${keyBase}-${index}`} href={href} className="text-orange-600 underline decoration-orange-300 underline-offset-2 hover:text-orange-500">
        {label}
      </a>,
    )
    last = index + full.length
    match = regex.exec(text)
  }

  if (last < text.length) output.push(text.slice(last))
  return output
}

export function MarkdownArticle({ markdown }: { markdown: string }) {
  const blocks = parseBlocks(markdown)

  return (
    <article className="space-y-5 text-slate-800">
      {blocks.map((block, index) => {
        if (block.type === 'divider') return <hr key={`d-${index}`} className="border-slate-200" />
        if (block.type === 'h1') return <h1 key={`h1-${index}`} className="text-3xl font-bold tracking-tight text-slate-950">{block.text}</h1>
        if (block.type === 'h2') return <h2 key={`h2-${index}`} className="pt-2 text-2xl font-bold text-slate-950">{block.text}</h2>
        if (block.type === 'h3') return <h3 key={`h3-${index}`} className="pt-1 text-lg font-semibold text-slate-900">{block.text}</h3>
        if (block.type === 'paragraph') {
          return (
            <p key={`p-${index}`} className="text-[15px] leading-relaxed text-slate-700">
              {renderInline(block.text, `p-${index}`)}
            </p>
          )
        }
        if (block.type === 'list') {
          if (block.ordered) {
            return (
              <ol key={`l-${index}`} className="ml-5 list-decimal space-y-1.5 text-[15px] leading-relaxed text-slate-700">
                {block.items.map((item, itemIndex) => (
                  <li key={`i-${index}-${itemIndex}`}>{renderInline(item, `i-${index}-${itemIndex}`)}</li>
                ))}
              </ol>
            )
          }

          return (
            <ul key={`l-${index}`} className="ml-5 list-disc space-y-1.5 text-[15px] leading-relaxed text-slate-700">
              {block.items.map((item, itemIndex) => (
                <li key={`i-${index}-${itemIndex}`}>{renderInline(item, `i-${index}-${itemIndex}`)}</li>
              ))}
            </ul>
          )
        }
        if (block.type === 'table') {
          const headers = block.rows[0] ?? []
          const body = block.rows.slice(1)
          return (
            <div key={`t-${index}`} className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full border-collapse text-left text-[14px]">
                <thead className="bg-slate-100 text-slate-900">
                  <tr>
                    {headers.map((cell, cellIndex) => (
                      <th key={`h-${index}-${cellIndex}`} className="border-b border-slate-200 px-3 py-2.5 font-semibold">
                        {renderInline(cell, `th-${index}-${cellIndex}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {body.map((row, rowIndex) => (
                    <tr key={`r-${index}-${rowIndex}`} className="odd:bg-white even:bg-slate-50">
                      {row.map((cell, cellIndex) => (
                        <td key={`c-${index}-${rowIndex}-${cellIndex}`} className="border-t border-slate-100 px-3 py-2 align-top text-slate-700">
                          {renderInline(cell, `td-${index}-${rowIndex}-${cellIndex}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        return null
      })}
    </article>
  )
}