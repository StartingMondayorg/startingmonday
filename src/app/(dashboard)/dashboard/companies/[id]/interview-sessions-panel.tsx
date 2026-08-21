import { addInterviewLog, deleteInterviewLog } from './actions'
import type { InterviewLog } from './company-detail-constants'
import { Badge, Button, Input, Label, Textarea } from '@/components/ui'
type Props = {
  companyId: string
  interviewLogs: InterviewLog[]
  todayISO: string
}

export function InterviewSessionsPanel(props: Props) {
  const { companyId, interviewLogs, todayISO } = props

  return (
    <>
      {interviewLogs.length > 0 && (
        <div className="divide-y divide-border">
          {interviewLogs.map((log) => {
            const dateLabel = log.interview_date
              ? new Date(log.interview_date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : null
            return (
              <div key={log.id} className="px-6 py-5">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    {dateLabel && <span className="text-[13px] text-muted-foreground">{dateLabel}</span>}
                    {log.interview_stage && (
                      <Badge className="bg-info/10 text-info">
                        {log.interview_stage}
                      </Badge>
                    )}
                  </div>
                  <form action={deleteInterviewLog.bind(null, log.id, companyId)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="text-[11px] text-muted-foreground hover:text-destructive"
                    >
                      Delete
                    </Button>
                  </form>
                </div>
                {log.questions_asked && (
                  <div className="mb-3">
                    <p className="text-[10px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1">Questions asked</p>
                    <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">{log.questions_asked}</p>
                  </div>
                )}
                {log.what_landed && (
                  <div className="mb-3">
                    <p className="text-[10px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1">What landed</p>
                    <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">{log.what_landed}</p>
                  </div>
                )}
                {log.what_surprised && (
                  <div className="mb-3">
                    <p className="text-[10px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1">What surprised me</p>
                    <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">{log.what_surprised}</p>
                  </div>
                )}
                {log.follow_up_needed && (
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1">Follow-up needed</p>
                    <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">{log.follow_up_needed}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="px-6 py-5 border-t border-border bg-muted/40">
        <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-4">Log session</div>
        <form action={addInterviewLog.bind(null, companyId)} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="block text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5">Date</Label>
              <Input
                name="interview_date"
                type="date"
                aria-label="Interview date"
                defaultValue={todayISO}
                className="w-full text-[13px] text-foreground focus-visible:border-border bg-muted/40"
              />
            </div>
            <div>
              <Label className="block text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5">Stage</Label>
              <Input
                name="interview_stage"
                type="text"
                placeholder="Recruiter screen, Hiring manager, Panel..."
                className="w-full text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:border-border bg-muted/40"
              />
            </div>
          </div>
          <div>
            <Label className="block text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5">Questions asked</Label>
            <Textarea
              name="questions_asked"
              rows={2}
              placeholder="What were you asked?"
              className="w-full text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:border-border resize-none bg-muted/40"
            />
          </div>
          <div>
            <Label className="block text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5">What landed</Label>
            <Textarea
              name="what_landed"
              rows={2}
              placeholder="What resonated, what got them nodding..."
              className="w-full text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:border-border resize-none bg-muted/40"
            />
          </div>
          <div>
            <Label className="block text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5">What surprised me</Label>
            <Textarea
              name="what_surprised"
              rows={2}
              placeholder="Unexpected questions, tone shifts, things you did not anticipate..."
              className="w-full text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:border-border resize-none bg-muted/40"
            />
          </div>
          <div>
            <Label className="block text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5">Follow-up needed</Label>
            <Textarea
              name="follow_up_needed"
              rows={2}
              placeholder="What to prep differently, what to send, what to address next time..."
              className="w-full text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:border-border resize-none bg-muted/40"
            />
          </div>
          <div>
            <Button type="submit" className="text-[13px] font-semibold px-5">
              Save session
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
