import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Executive Resume Optimizer - Starting Monday',
  description: 'Paste your LinkedIn profile and a job description. Get an ATS score, recruiter grade, and a tailored resume in about a minute. Free, no account required.',
  keywords: [
    'executive resume optimizer',
    'CIO resume tailor',
    'ATS resume checker',
    'AI resume tailoring',
    'executive resume keywords',
    'resume for CIO job',
    'technology executive resume',
  ],
  openGraph: {
    title: 'Free Executive Resume Optimizer',
    description: 'Paste your LinkedIn profile and a job description. Get an ATS score, recruiter grade, and a tailored resume in about a minute.',
    url: 'https://startingmonday.app/optimize',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Executive Resume Optimizer - Starting Monday',
    description: 'ATS score, recruiter grade, and tailored resume in about a minute. Free, no account required.',
  },
  alternates: {
    canonical: 'https://startingmonday.app/optimize',
  },
}

// Kept for the route metadata above; PostHog is provided by the root layout.
export default function OptimizeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
