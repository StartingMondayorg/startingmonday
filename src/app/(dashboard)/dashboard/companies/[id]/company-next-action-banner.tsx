import Link from 'next/link'
import { Alert, AlertDescription, Button } from '@/components/ui'
type ContactLite = {
  id: string
  outreach_status: string | null
}

type Props = {
  contacts: ContactLite[]
  prepBriefCount: number
  stage: string
  interviewLogsLength: number
  companyName: string
  companyId: string
}

export function CompanyNextActionBanner(props: Props) {
  const hasContacts = props.contacts.length > 0
  const hasBrief = props.prepBriefCount > 0
  const hasOutreachStarted = props.contacts.some((ct) => ct.outreach_status && ct.outreach_status !== 'prospect')
  const isInterviewing = props.stage === 'interviewing'
  const hasInterviewLogs = props.interviewLogsLength > 0

  if (!hasContacts && !hasBrief) {
    return (
      <Alert className="mt-6 px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-primary-foreground">Two things move this forward.</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">Add a contact at {props.companyName} and run a prep brief before your first conversation.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="outline" render={<Link href="#add-contact-form" />}>
            Add contact
          </Button>
          <Button render={<Link href={`/dashboard/companies/${props.companyId}/prep`} />}>
            Run a brief
          </Button>
        </div>
      </Alert>
    )
  }

  if (isInterviewing && !hasInterviewLogs) {
    return (
      <Alert variant="warning" className="mt-6 px-6 py-4 flex items-center justify-between gap-4">
        <AlertDescription>
          You are in the interview loop. Log what happened so your next brief reflects the actual conversation.
        </AlertDescription>
        <Button variant="outline" className="shrink-0" render={<Link href={`/dashboard/companies/${props.companyId}/prep`} />}>
          Run interview prep
        </Button>
      </Alert>
    )
  }

  if (!hasBrief) {
    return (
      <Alert className="mt-6 px-6 py-4 flex items-center justify-between gap-4">
        <AlertDescription>
          {hasContacts ? `You have contacts at ${props.companyName}. Run a brief before your next call.` : `No prep brief for ${props.companyName} yet.`}
        </AlertDescription>
        <Button variant="outline" className="shrink-0" render={<Link href={`/dashboard/companies/${props.companyId}/prep`} />}>
          Generate brief
        </Button>
      </Alert>
    )
  }

  if (hasContacts && !hasOutreachStarted && props.stage === 'watching') {
    return (
      <Alert variant="info" className="mt-6 px-6 py-4 flex items-center justify-between gap-4">
        <AlertDescription>Ready to reach out? You have a contact here.</AlertDescription>
        <Button
          variant="outline"
          className="shrink-0"
          render={<Link href={`/dashboard/contacts/${props.contacts[0]?.id}/outreach`} />}
        >
          Draft outreach
        </Button>
      </Alert>
    )
  }

  return null
}
