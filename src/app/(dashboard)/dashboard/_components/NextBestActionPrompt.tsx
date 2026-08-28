import { TrackLink } from '@/app/components/TrackLink'
import { Alert, AlertDescription, AlertTitle, Button } from '@/components/ui'
export function NextBestActionPrompt({
  action,
  href,
  description,
  source,
}: {
  action: string
  href: string
  description?: string
  source: 'stall_nudge' | 'dashboard_default'
}) {
  return (
    <Alert variant="warning" className="mb-5 shadow-sm">
      <AlertTitle>Next best action</AlertTitle>
      <AlertDescription className="mb-2">{description}</AlertDescription>
      <Button
        size="sm"
        variant="outline"
        className="border-warning/40 text-warning hover:bg-warning/10"
        render={
          <TrackLink
            href={href}
            event="next_best_action_clicked"
            properties={{ source, action }}
          />
        }
      >
        {action} →
      </Button>
    </Alert>
  )
}
