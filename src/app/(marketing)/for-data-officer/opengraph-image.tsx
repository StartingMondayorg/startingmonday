import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const alt = 'Starting Monday for Chief Data Officers - find the companies where data is genuinely strategic'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        background: '#0f172a',
        padding: '80px 96px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38bdf8', marginRight: '14px' }} />
        <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#475569' }}>
          Starting Monday - For Chief Data Officers
        </span>
      </div>
      <div style={{ fontSize: '64px', fontWeight: 800, lineHeight: 1.05, color: '#f8fafc', marginBottom: '28px', maxWidth: '900px' }}>
        Most Chief Data Officer titles are not C-suite mandates. Find the ones that are.
      </div>
      <div style={{ fontSize: '24px', color: '#94a3b8', lineHeight: 1.5, maxWidth: '780px' }}>
        Data is the strategy. Campaign infrastructure to find the organizations that mean it.
      </div>
      <div style={{ position: 'absolute', bottom: '52px', right: '96px', fontSize: '16px', color: '#334155', letterSpacing: '0.05em' }}>
        startingmonday.app/for-data-officer
      </div>
    </div>,
    size,
  )
}
