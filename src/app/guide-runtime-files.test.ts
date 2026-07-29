import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFile } from 'node:fs/promises'
import { readGuideRuntimeFile } from './guide-runtime-files'

vi.mock('node:fs/promises', async (importOriginal) => ({
  ...await importOriginal<typeof import('node:fs/promises')>(),
  readFile: vi.fn(),
}))

const readFileMock = vi.mocked(readFile)

function fileError(code: string): NodeJS.ErrnoException {
  return Object.assign(new Error(code), { code })
}

describe('readGuideRuntimeFile', () => {
  beforeEach(() => {
    readFileMock.mockReset()
  })

  it('loads guide data from the source tree', async () => {
    readFileMock.mockResolvedValue('source guide')

    await expect(readGuideRuntimeFile('user-guide.md')).resolves.toBe('source guide')
    expect(readFileMock).toHaveBeenCalledOnce()
    expect(readFileMock.mock.calls[0][0]).toMatch(/docs[\\/]user-guide\.md$/)
  })

  it('loads packaged guide data when the source tree is unavailable', async () => {
    readFileMock
      .mockRejectedValueOnce(fileError('ENOENT'))
      .mockResolvedValueOnce('packaged guide')

    await expect(readGuideRuntimeFile('user-guide.md')).resolves.toBe('packaged guide')
    expect(readFileMock).toHaveBeenCalledTimes(2)
    expect(readFileMock.mock.calls[1][0]).toMatch(/\.next[\\/]server[\\/]guide-data[\\/]user-guide\.md$/)
  })

  it('returns an empty string when neither guide file exists', async () => {
    readFileMock.mockRejectedValue(fileError('ENOENT'))

    await expect(readGuideRuntimeFile('user-guide.md')).resolves.toBe('')
    expect(readFileMock).toHaveBeenCalledTimes(2)
  })

  it('rethrows non-missing-file errors without trying the packaged path', async () => {
    const error = fileError('EACCES')
    readFileMock.mockRejectedValue(error)

    await expect(readGuideRuntimeFile('user-guide.md')).rejects.toBe(error)
    expect(readFileMock).toHaveBeenCalledOnce()
  })
})