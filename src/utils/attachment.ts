export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024
export const MAX_ATTACHMENTS = 20
export const ATTACHMENT_NAME_MAX_LENGTH = 200

export type Attachment = {
  id: string
  eventId: string
  name: string
  type: string
  size: number
  createdAt: string
  uploadedBy: { id: string; name: string } | null
}

export type RejectedFile = { name: string; reason: 'tooLarge' | 'empty' | 'tooMany' }

const CONTROL_CHARACTERS = /\p{Cc}/gu
const PATH_SEPARATORS = /[\\/]/

const text = (value: unknown) => (typeof value === 'string' ? value : '')

export const cleanFileName = (name: string) => {
  const base = name.split(PATH_SEPARATORS).pop() ?? ''
  const cleaned = base.replace(CONTROL_CHARACTERS, '').trim()
  return cleaned.slice(0, ATTACHMENT_NAME_MAX_LENGTH) || 'file'
}

export const parseAttachment = (value: unknown): Attachment | null => {
  if (typeof value !== 'object' || value === null) return null
  const { id, eventId, name, type, size, createdAt, uploadedBy } = value as Record<string, unknown>
  if (!text(id) || !text(eventId) || !text(name) || typeof size !== 'number' || size < 0) return null
  const uploader =
    typeof uploadedBy === 'object' && uploadedBy !== null ? (uploadedBy as Record<string, unknown>) : null
  return {
    id: text(id),
    eventId: text(eventId),
    name: cleanFileName(text(name)),
    type: text(type) || 'application/octet-stream',
    size,
    createdAt: text(createdAt),
    uploadedBy: uploader && text(uploader.id) ? { id: text(uploader.id), name: text(uploader.name) } : null,
  }
}

export const parseAttachments = (value: unknown): Attachment[] =>
  Array.isArray(value) ? value.flatMap((entry) => parseAttachment(entry) ?? []) : []

export const checkFiles = <T extends { name: string; size: number }>(files: readonly T[], existing: number) => {
  const accepted: T[] = []
  const rejected: RejectedFile[] = []
  for (const file of files) {
    if (file.size === 0) rejected.push({ name: file.name, reason: 'empty' })
    else if (file.size > MAX_ATTACHMENT_SIZE) rejected.push({ name: file.name, reason: 'tooLarge' })
    else if (existing + accepted.length >= MAX_ATTACHMENTS) rejected.push({ name: file.name, reason: 'tooMany' })
    else accepted.push(file)
  }
  return { accepted, rejected }
}

const UNITS = ['byte', 'kilobyte', 'megabyte'] as const

export const formatFileSize = (bytes: number, locale?: string) => {
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024
    unit += 1
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: UNITS[unit],
    unitDisplay: 'short',
    maximumFractionDigits: unit === 0 || value >= 10 ? 0 : 1,
  }).format(value)
}

export const saveBlob = (blob: Blob, name: string, root: ParentNode & Node = document.body) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.rel = 'noopener'
  link.style.display = 'none'
  root.appendChild(link)
  link.click()
  setTimeout(() => {
    link.remove()
    URL.revokeObjectURL(url)
  }, 1000)
}
