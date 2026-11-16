import { describe, expect, it } from 'vitest'
import { checkFiles, cleanFileName, formatFileSize, MAX_ATTACHMENT_SIZE, parseAttachment } from './attachment.ts'

describe('attachments', () => {
  it('parses attachments and cleans their names', () => {
    expect(
      parseAttachment({
        id: 'a1',
        eventId: 'e1',
        name: '..\\..\\Plan\u0007.pdf',
        type: '',
        size: 10,
        createdAt: '2026-11-16T10:00:00Z',
        uploadedBy: { id: 'u1', name: 'Anna' },
      }),
    ).toEqual({
      id: 'a1',
      eventId: 'e1',
      name: 'Plan.pdf',
      type: 'application/octet-stream',
      size: 10,
      createdAt: '2026-11-16T10:00:00Z',
      uploadedBy: { id: 'u1', name: 'Anna' },
    })
    expect(parseAttachment({ id: 'a1', eventId: 'e1', name: 'x', size: -1 })).toBeNull()
    expect(cleanFileName('/tmp/')).toBe('file')
  })

  it('checks size, emptiness and the number of files', () => {
    const file = (name: string, size: number) => ({ name, size })
    const { accepted, rejected } = checkFiles(
      [file('a', 1), file('empty', 0), file('big', MAX_ATTACHMENT_SIZE + 1), file('b', 2), file('c', 3)],
      18,
    )
    expect(accepted.map((entry) => entry.name)).toEqual(['a', 'b'])
    expect(rejected).toEqual([
      { name: 'empty', reason: 'empty' },
      { name: 'big', reason: 'tooLarge' },
      { name: 'c', reason: 'tooMany' },
    ])
  })

  it('formats sizes', () => {
    expect(formatFileSize(512, 'en')).toBe('512 byte')
    expect(formatFileSize(1536, 'en')).toBe('1.5 kB')
    expect(formatFileSize(10 * 1024 * 1024, 'de')).toBe('10 MB')
  })
})
