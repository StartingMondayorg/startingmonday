import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { headers } from 'next/headers'
import { AssistWidget } from "@/app/components/AssistWidget";
import { PHProvider } from "@/app/components/PosthogProvider";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import { getBrandContextFromHosts } from '@/lib/brand'
import { buildBrandMetadata } from './brand-metadata'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
});

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers()
  const brand = getBrandContextFromHosts([
    requestHeaders.get('host'),
    requestHeaders.get('x-forwarded-host'),
  ])

  return buildBrandMetadata(brand)
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // CSP nonce generated per-request in src/proxy.ts. Next.js attaches it to its
  // own framework scripts automatically, but next-themes' pre-paint theme script
  // is injected outside that plumbing, so it must receive the nonce explicitly
  // or the browser blocks it (SMK-490).
  const nonce = (await headers()).get('x-nonce') ?? undefined
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/*
          Mounted at the root so every route can capture anonymous visitors.
          user_events cannot: its user_id is NOT NULL and the channel-funnel
          route no-ops when logged out, so PostHog is the only channel that
          sees someone before they sign up. While this lived on a handful of
          layouts, TrackLink's posthog?.capture() silently did nothing on the
          homepage and every persona page (SMK-458).
        */}
        <ThemeProvider nonce={nonce}>
          <PHProvider>
            {children}
            <AssistWidget />
          </PHProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
