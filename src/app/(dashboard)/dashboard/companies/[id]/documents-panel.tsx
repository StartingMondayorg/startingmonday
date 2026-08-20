import { addDocument, removeDocument } from './actions'
import { DOC_LABELS } from './company-detail-constants'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
        <div className="divide-y divide-white/10">
          {documents.map((doc) => {
            const dl = DOC_LABELS[doc.label] ?? { label: doc.label, cls: 'bg-white/10 text-slate-400' }
            return (
              <div key={doc.id} className="px-6 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge className={`tracking-[0.04em] ${dl.cls}`}>
                      {dl.label}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-slate-400 leading-relaxed line-clamp-2">
                    {doc.content.slice(0, previewChars)}{doc.content.length > previewChars ? '...' : ''}
                  </p>
                </div>
                <form action={removeDocument.bind(null, doc.id, companyId)}>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="text-[11px] text-slate-300 hover:text-red-500 shrink-0"
                  >
                    Remove
                  </Button>
                </form>
              </div>
            )
          })}
        </div>
      )}

      <div className="px-6 py-5 border-t border-white/10 bg-white/5">
        <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-4">Add document</div>
        <form action={addDocument.bind(null, companyId)} className="flex flex-col gap-3">
          <div>
            <Label htmlFor="doc-label" className="block text-[11px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">Type</Label>
            <Select name="label" defaultValue="job_description">
              <SelectTrigger id="doc-label" className="w-full text-[13px] text-white focus-visible:border-slate-400 bg-white/5">
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
            <Label htmlFor="doc-content" className="block text-[11px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">
              Content <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="doc-content"
              name="content"
              required
              rows={7}
              placeholder="Paste a job description, news article, annual report excerpt, or org notes..."
              className="w-full text-[13px] text-white placeholder:text-slate-300 focus-visible:border-slate-400 resize-none bg-white/5 leading-relaxed"
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
