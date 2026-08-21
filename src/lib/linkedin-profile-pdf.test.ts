import { describe, expect, it } from 'vitest'
import {
  extractLinkedInProfilePdfText,
  LINKEDIN_PROFILE_PDF_MAX_BYTES,
  LinkedInProfilePdfError,
} from './linkedin-profile-pdf'

function file(data: string, size = Buffer.byteLength(data)) {
  const bytes = Buffer.from(data)
  return {
    size,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  }
}

describe('extractLinkedInProfilePdfText', () => {
  it('accepts a PDF, normalizes null bytes, and trims extracted text', async () => {
    const text = await extractLinkedInProfilePdfText(
      file('%PDF-1.7 source'),
      async () => '  Alex\x00 Rivera  ',
    )

    expect(text).toBe('Alex Rivera')
  })

  it('rejects files larger than five megabytes before parsing', async () => {
    await expect(extractLinkedInProfilePdfText(
      file('%PDF-1.7 source', LINKEDIN_PROFILE_PDF_MAX_BYTES + 1),
    )).rejects.toMatchObject({ status: 413 } satisfies Partial<LinkedInProfilePdfError>)
  })

  it('rejects files without a PDF magic header', async () => {
    await expect(extractLinkedInProfilePdfText(file('not a PDF'))).rejects.toMatchObject({
      status: 415,
    } satisfies Partial<LinkedInProfilePdfError>)
  })

  it('rejects empty extracted text and parser failures', async () => {
    await expect(extractLinkedInProfilePdfText(file('%PDF-1.7 source'), async () => ' \x00 ')).rejects.toMatchObject({
      status: 422,
      message: 'No readable text found in this PDF. Try pasting your profile text instead.',
    } satisfies Partial<LinkedInProfilePdfError>)
    await expect(extractLinkedInProfilePdfText(file('%PDF-1.7 source'), async () => {
      throw new Error('parser failure')
    })).rejects.toMatchObject({
      status: 422,
      message: 'Could not read the PDF. Try pasting your profile text instead.',
    } satisfies Partial<LinkedInProfilePdfError>)
  })
})