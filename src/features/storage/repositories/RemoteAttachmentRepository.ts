import { encodePathSegment, type ApiClient } from '../../../utils/api.ts'
import { parseAttachment, parseAttachments, type Attachment } from '../../../utils/attachment.ts'
import type { AttachmentRepository } from '../types/storage.ts'
import { requireValue } from '../../../utils/parse.ts'

const TRANSFER_TIMEOUT_MS = 120_000

export class RemoteAttachmentRepository implements AttachmentRepository {
  readonly #api: ApiClient

  constructor(api: ApiClient) {
    this.#api = api
  }

  async list(eventId: string) {
    return parseAttachments(await this.#api.get<unknown>(`/events/${encodePathSegment(eventId)}/attachments`))
  }

  async upload(eventId: string, file: File) {
    const form = new FormData()
    form.append('file', file, file.name)
    return requireValue(
      parseAttachment(
        await this.#api.post<unknown>(`/events/${encodePathSegment(eventId)}/attachments`, form, {
          timeoutMs: TRANSFER_TIMEOUT_MS,
        }),
      ),
    )
  }

  download(attachment: Attachment) {
    return this.#api.get<Blob>(`/attachments/${encodePathSegment(attachment.id)}/content`, {
      responseType: 'blob',
      timeoutMs: TRANSFER_TIMEOUT_MS,
    })
  }

  remove(id: string) {
    return this.#api.delete(`/attachments/${encodePathSegment(id)}`)
  }
}
