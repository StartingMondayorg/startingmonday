export const LINKEDIN_PROFILE_PDF_MAX_BYTES = 5 * 1024 * 1024

export class LinkedInProfilePdfError extends Error {
  constructor(
    message: string,
    public readonly status: 400 | 413 | 415 | 422,
  ) {
    super(message)
  }
}

type TextExtractor = (data: Buffer) => Promise<string>

async function extractTextWithPdfParse(data: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data })
  try {
    return (await parser.getText()).text
  } finally {
    await parser.destroy()
  }
}

function isPdf(data: Buffer): boolean {
  return data.length >= 4
    && data[0] === 0x25
    && data[1] === 0x50
    && data[2] === 0x44
    && data[3] === 0x46
}

export async function extractLinkedInProfilePdfText(
  file: Pick<File, 'size' | 'arrayBuffer'>,
  extractText: TextExtractor = extractTextWithPdfParse,
): Promise<string> {
  if (file.size > LINKEDIN_PROFILE_PDF_MAX_BYTES) {
    throw new LinkedInProfilePdfError('File too large (5 MB max)', 413)
  }

  const data = Buffer.from(await file.arrayBuffer())
  if (!isPdf(data)) {
    throw new LinkedInProfilePdfError(
      'Only PDF files are supported. Download your LinkedIn profile as a PDF and try again.',
      415,
    )
  }

  let extracted: string
  try {
    extracted = await extractText(data)
  } catch {
    throw new LinkedInProfilePdfError('Could not read the PDF. Try pasting your profile text instead.', 422)
  }

  const text = extracted.replace(/\x00/g, '').trim()
  if (!text) {
    throw new LinkedInProfilePdfError('No readable text found in this PDF. Try pasting your profile text instead.', 422)
  }
  return text
}