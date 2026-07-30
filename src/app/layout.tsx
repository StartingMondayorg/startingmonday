import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { headers } from 'next/headers'
import { AssistWidget } from "@/components/AssistWidget";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {children}
        <AssistWidget />
      </body>
    </html>
  );
}
