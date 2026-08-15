import { NextResponse } from 'next/server'

export function GET() {
  return new NextResponse(
    'Contact: mailto:security@startingmonday.com\n' +
    'Policy: https://www.startingmonday.com/security\n' +
    'Canonical: https://www.startingmonday.com/.well-known/security.txt\n',
    { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } },
  )
}