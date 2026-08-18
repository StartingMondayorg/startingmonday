'use client'

// Deterministic hash so every user gets a slightly different overlay geometry.
// Same email always produces the same watermark - stable across sessions.
function djb2(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function WatermarkOverlay({ email }: { email: string }) {
  const h = djb2(email)

  // Geometry varies per user: rotation, opacity, tile size, tile offset
  const angle   = -(22 + (h % 12))          // -22° to -33°
  const opacity = (14 + (h % 8)) / 1000     // 0.014 – 0.021
  const offsetX = h % 80
  const offsetY = (h >> 8) % 60
  const tileW   = 380 + (h % 80)
  const tileH   = 160 + (h % 60)
  const cx = tileW / 2
  const cy = tileH / 2

  const svg = [
    `<svg xmlns='http://www.w3.org/2000/svg' width='${tileW}' height='${tileH}'>`,
    `<text x='${cx}' y='${cy}'`,
    ` transform='rotate(${angle} ${cx} ${cy})'`,
    ` text-anchor='middle' font-family='system-ui,sans-serif'`,
    ` font-size='11' fill='rgba(0,0,0,${opacity})'>Starting Monday · Confidential</text>`,
    `</svg>`,
  ].join('')

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9998,
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
        backgroundPosition: `${offsetX}px ${offsetY}px`,
        userSelect: 'none',
      }}
    />
  )
}
