import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const alt = 'Starting Monday for COOs - campaign infrastructure for technology executives making the move into operational leadership'
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '40px',
        }}
      >
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#38bdf8',
            marginRight: '14px',
          }}
        />
        <span
          style={{
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#475569',
          }}
        >
          Starting Monday - For COOs
        </span>
      </div>
      <div
        style={{
          fontSize: '64px',
          fontWeight: 800,
          lineHeight: 1.05,
          color: '#f8fafc',
          marginBottom: '28px',
          maxWidth: '900px',
        }}
      >
        The technology executive who can run the business is the most valuable person in the room.
      </div>
      <div
        style={{
          fontSize: '24px',
          color: '#94a3b8',
          lineHeight: 1.5,
          maxWidth: '780px',
        }}
      >
        Make the move from CIO or CTO into operational leadership deliberately. With the right narrative.
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '52px',
          right: '96px',
          fontSize: '16px',
          color: '#334155',
          letterSpacing: '0.05em',
        }}
      >
        startingmonday.app/for-coo
      </div>
    </div>,
    size,
  )
}
