import { NextResponse } from 'next/server'

// Retired: temporary demo report endpoint.
// Partner reporting must be served from an authenticated partner dashboard flow.
export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint has been retired.' },
    { status: 410 },
  )
}
