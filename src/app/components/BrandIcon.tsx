import type { SVGProps } from 'react'

export type BrandIconName =
  | 'faq'
  | 'security'
  | 'trust'
  | 'pricing'
  | 'performance'
  | 'bug'
  | 'feature'
  | 'uiux'
  | 'other'

type BrandIconProps = SVGProps<SVGSVGElement> & {
  name: BrandIconName
}

export function BrandIcon({ name, className, ...props }: BrandIconProps) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    ...props,
  }

  switch (name) {
    case 'faq':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M6 4h8l4 4v12H6z" />
          <path d="M14 4v4h4" />
          <path d="M10 12a2 2 0 1 1 3.5 1.3c-.8.8-1.5 1.2-1.5 2.2" />
          <circle cx="12" cy="18" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'security':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M12 3l7 3v5c0 5-3.4 8.2-7 10-3.6-1.8-7-5-7-10V6z" />
          <path d="M9 12.5l2 2 4-4" />
        </svg>
      )
    case 'trust':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M12 3l7 3v5c0 5-3.4 8.2-7 10-3.6-1.8-7-5-7-10V6z" />
          <rect x="9" y="11" width="6" height="5" rx="1" />
          <path d="M10.5 11v-1a1.5 1.5 0 1 1 3 0v1" />
        </svg>
      )
    case 'pricing':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 19h16" />
          <path d="M7 16V9" />
          <path d="M12 16V6" />
          <path d="M17 16v-4" />
          <circle cx="17" cy="8" r="2" />
        </svg>
      )
    case 'performance':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M13 3L6 13h5l-1 8 8-12h-5z" />
        </svg>
      )
    case 'bug':
      return (
        <svg {...common} aria-hidden="true">
          <ellipse cx="12" cy="13" rx="4" ry="5" />
          <path d="M12 8V6" />
          <path d="M8 10L6 8" />
          <path d="M16 10l2-2" />
          <path d="M8 13H5" />
          <path d="M19 13h-3" />
          <path d="M8 16l-2 2" />
          <path d="M16 16l2 2" />
        </svg>
      )
    case 'feature':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M12 3l1.8 4.4L18 9l-4.2 1.6L12 15l-1.8-4.4L6 9l4.2-1.6z" />
        </svg>
      )
    case 'uiux':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 6h10" />
          <path d="M4 10h8" />
          <path d="M4 14h6" />
          <path d="M16 6l4 4-7 7-4 1 1-4z" />
        </svg>
      )
    case 'other':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 6h16v10H8l-4 4z" />
          <circle cx="9" cy="11" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="12" cy="11" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="15" cy="11" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      )
    default:
      return null
  }
}
