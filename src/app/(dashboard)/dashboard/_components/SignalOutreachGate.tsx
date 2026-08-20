'use client'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export function SignalOutreachGate({
  signalId,
  companyName,
  action,
}: {
  signalId: string
  companyName: string | null
  action: (formData: FormData) => void | Promise<void>
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="outline" className="h-auto px-3 py-1.5 text-[12px] font-semibold" />}
      >
        Generate outreach
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Generate outreach</AlertDialogTitle>
          <AlertDialogDescription>
            This works best as a reconnect to someone who already knows you
            {companyName ? ` at ${companyName}` : ''}. Cold outreach on a signal rarely lands at this level.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={action}>
          <input type="hidden" name="signal_id" value={signalId} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction type="submit">I know someone here - generate</AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
