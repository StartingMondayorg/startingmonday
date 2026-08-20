'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function LogoutButton({ label }: { label: string }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      className="min-h-[44px] px-2 text-[12px] text-slate-300 hover:text-white hover:bg-transparent whitespace-nowrap"
    >
      {label}
    </Button>
  )
}
