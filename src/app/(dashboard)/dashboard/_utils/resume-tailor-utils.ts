export type Parsed = {
  tailored: string
  keywords: string
  changes: string
}

export type QualityCheck = {
  atsScore: string
  atsNotes: string
  recruiterGrade: string
  recruiterNotes: string
  hiringManagerGrade: string
  hiringManagerNotes: string
  weakBullets: string
  verbalCover: string
  sixSecondGrade: string
  sixSecondNotes: string
}

export type Section = 'all' | 'resume' | 'keywords' | 'changes' | 'quality'

export function cleanResume(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^#{1,3} (.*)/gm, (_, body) => body.toUpperCase())
    .replace(/^-{3,}\s*$/gm, '')
    .replace(/_{3,}/g, '')
    .replace(/-/g, ',')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function parseOutput(raw: string): Parsed {
  const tailoredMatch = raw.match(/## TAILORED RESUME\s*([\s\S]*?)(?=## KEYWORD ANALYSIS|$)/i)
  const keywordsMatch = raw.match(/## KEYWORD ANALYSIS\s*([\s\S]*?)(?=## KEY CHANGES|$)/i)
  const changesMatch  = raw.match(/## KEY CHANGES\s*([\s\S]*)$/i)
  const tailored = tailoredMatch?.[1]?.trim() ?? (!keywordsMatch && !changesMatch ? raw.trim() : '')
  return {
    tailored,
    keywords: keywordsMatch?.[1]?.trim() ?? '',
    changes:  changesMatch?.[1]?.trim()  ?? '',
  }
}

export function parseQualityCheck(raw: string): QualityCheck {
  const get = (header: string, nextHeader?: string) => {
    const pattern = nextHeader
      ? new RegExp(`## ${header}\\s*([\\s\\S]*?)(?=## ${nextHeader}|$)`)
      : new RegExp(`## ${header}\\s*([\\s\\S]*)$`)
    return raw.match(pattern)?.[1]?.trim() ?? ''
  }
  return {
    atsScore:            get('ATS SCORE',           'ATS NOTES').replace(/\D/g, ''),
    atsNotes:            get('ATS NOTES',            'RECRUITER GRADE'),
    recruiterGrade:      get('RECRUITER GRADE',      'RECRUITER NOTES').slice(0, 1).toUpperCase(),
    recruiterNotes:      get('RECRUITER NOTES',      'HIRING MANAGER GRADE'),
    hiringManagerGrade:  get('HIRING MANAGER GRADE', 'HIRING MANAGER NOTES').slice(0, 1).toUpperCase(),
    hiringManagerNotes:  get('HIRING MANAGER NOTES', 'WEAK BULLETS'),
    weakBullets:         get('WEAK BULLETS',         'VERBAL COVER'),
    verbalCover:         get('VERBAL COVER',         'SIX SECOND TEST'),
    sixSecondGrade:      get('SIX SECOND TEST',      'SIX SECOND NOTES').slice(0, 1).toUpperCase(),
    sixSecondNotes:      get('SIX SECOND NOTES'),
  }
}

export function gradeColor(grade: string) {
  return grade === 'A' ? 'text-green-700 bg-green-50 border-green-200'
    : grade === 'B'    ? 'text-blue-700 bg-blue-50 border-blue-100'
    : grade === 'C'    ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-red-700 bg-red-50 border-red-200'
}

export function atsColor(score: number) {
  return score >= 85 ? 'text-green-700'
    : score >= 70    ? 'text-blue-700'
    : score >= 55    ? 'text-amber-600'
    : 'text-red-700'
}

export async function downloadDocx(text: string, companyName: string, suffix?: string) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')

  const lines = text.split('\n')
  const children = lines.map(line => {
    const trimmed = line.trim()
    if (!trimmed) return new Paragraph({ children: [new TextRun('')], spacing: { after: 100 } })
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !/^\d/.test(trimmed)) {
      return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: trimmed, bold: true })],
        spacing: { before: 280, after: 120 },
      })
    }
    if (/^[-*•]/.test(trimmed)) {
      return new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: trimmed.replace(/^[-*•]\s*/, ''), size: 22 })],
        spacing: { after: 60 },
      })
    }
    return new Paragraph({
      children: [new TextRun({ text: trimmed, size: 22 })],
      spacing: { after: 80 },
    })
  })

  const doc = new Document({ sections: [{ children }] })
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const base = companyName ? `Resume - ${companyName}` : 'Resume - Tailored'
  a.download = suffix ? `${base} (${suffix}).docx` : `${base}.docx`
  a.click()
  URL.revokeObjectURL(url)
}
