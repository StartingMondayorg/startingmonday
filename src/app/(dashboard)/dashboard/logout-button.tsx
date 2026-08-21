'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
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
      className="min-h-[44px] px-2 text-[12px] text-muted-foreground hover:text-foreground hover:bg-transparent whitespace-nowrap"
    >
      {label}
    </Button>
  )
}
