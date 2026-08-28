import { addDocument, removeDocument } from './actions'
import { DOC_LABELS } from './company-detail-constants'
import { Badge, Button, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@/components/ui'
type DocumentRow = {
  id: string
  label: string
  content: string
}

type Props = {
  companyId: string
  documents: DocumentRow[]
  previewChars: number
}

export function DocumentsPanel(props: Props) {
  const { companyId, documents, previewChars } = props

  return (
    <>
      {documents.length > 0 && (
        <div className="divide-y divide-border">
          {documents.map((doc) => {
            const dl = DOC_LABELS[doc.label] ?? { label: doc.label, cls: 'bg-muted/60 text-muted-foreground' }
            return (
              <div key={doc.id} className="px-6 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge className={`tracking-[0.04em] ${dl.cls}`}>
                      {dl.label}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2">
                    {doc.content.slice(0, previewChars)}{doc.content.length > previewChars ? '...' : ''}
                  </p>
                </div>
                <form action={removeDocument.bind(null, doc.id, companyId)}>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="text-[11px] text-muted-foreground hover:text-destructive shrink-0"
                  >
                    Remove
                  </Button>
                </form>
              </div>
            )
          })}
        </div>
      )}

      <div className="px-6 py-5 border-t border-border bg-muted/40">
        <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-4">Add document</div>
        <form action={addDocument.bind(null, companyId)} className="flex flex-col gap-3">
          <div>
            <Label htmlFor="doc-label" className="block text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5">Type</Label>
            <Select name="label" defaultValue="job_description">
              <SelectTrigger id="doc-label" className="w-full text-[13px] text-foreground focus-visible:border-border bg-muted/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="job_description">Job Description</SelectItem>
                <SelectItem value="news">News & Press</SelectItem>
                <SelectItem value="annual_report">Annual Report</SelectItem>
                <SelectItem value="org_notes">Org Notes</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="doc-content" className="block text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5">
              Content <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="doc-content"
              name="content"
              required
              rows={7}
              placeholder="Paste a job description, news article, annual report excerpt, or org notes..."
              className="w-full text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:border-border resize-none bg-muted/40 leading-relaxed"
            />
          </div>
          <div>
            <Button type="submit" className="text-[13px] font-semibold px-5">
              Save document
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
