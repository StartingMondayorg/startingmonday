'use client'
import { RouteError } from '@/app/(dashboard)/dashboard/_components/RouteError'
export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} />
}

