import { useRef, useState, type DragEvent } from 'react'
import { AddChip } from '../../../components/AddChip.tsx'
import { PaperclipIcon } from '../../../components/Icons.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { getErrorMessage, useI18n } from '../../../i18n/index.ts'
import {
  checkFiles,
  formatFileSize,
  MAX_ATTACHMENT_SIZE,
  MAX_ATTACHMENTS,
  type Attachment,
  type RejectedFile,
} from '../utils/attachment.ts'
import { classNames } from '../../../utils/classNames.ts'
import { useAttachments } from '../hooks/useAttachments.ts'
import { RemoveButton } from '../../../components/RemoveButton.tsx'
import { FileInput } from '../../../components/Input.tsx'

type AttachmentsFieldProps = {
  eventId: string | null
  canEdit: boolean
  pending: readonly File[]
  onPendingChange: (files: File[]) => void
}

export function AttachmentsField({ eventId, canEdit, pending, onPendingChange }: AttachmentsFieldProps) {
  const { m, locale } = useI18n()
  const text = m.events.attachments
  const input = useRef<HTMLInputElement>(null)
  const [rejected, setRejected] = useState<RejectedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const { attachments, isLoading, loadError, upload, remove, download } = useAttachments(eventId)
  const uploading = useAsyncAction(upload)
  const removing = useAsyncAction(remove)
  const downloading = useAsyncAction(download)
  const count = attachments.length + pending.length
  const canAdd = canEdit && count < MAX_ATTACHMENTS && !uploading.isPending

  const add = (files: readonly File[]) => {
    const { accepted, rejected: refused } = checkFiles(files, count)
    setRejected(refused)
    if (accepted.length === 0) return
    if (eventId) void uploading.run(accepted)
    else onPendingChange([...pending, ...accepted])
  }

  const dropFiles = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    if (canAdd) add([...event.dataTransfer.files])
  }

  const maxSize = formatFileSize(MAX_ATTACHMENT_SIZE, locale)
  const describe = (attachment: Attachment) =>
    [formatFileSize(attachment.size, locale), attachment.uploadedBy && text.uploadedBy(attachment.uploadedBy.name)]
      .filter(Boolean)
      .join(' · ')

  return (
    <section
      className={classNames('attachments', isDragOver && 'attachments--dragOver')}
      aria-label={text.title}
      onDragOver={(event) => {
        if (!canAdd || !event.dataTransfer.types.includes('Files')) return
        event.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={dropFiles}
    >
      <span className="descriptor">{text.title}</span>
      {(attachments.length > 0 || pending.length > 0) && (
        <ul className="attachmentList">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="attachmentItem">
              <PaperclipIcon size={16} />
              <button
                type="button"
                className="attachmentName"
                title={text.download(attachment.name)}
                disabled={downloading.isPending}
                onClick={() => void downloading.run(attachment)}
              >
                {attachment.name}
              </button>
              <span className="attachmentMeta">{describe(attachment)}</span>
              {canEdit && (
                <RemoveButton
                  label={text.remove(attachment.name)}
                  disabled={removing.isPending}
                  onClick={() => void removing.run(attachment)}
                />
              )}
            </li>
          ))}
          {pending.map((file, index) => (
            <li key={`${file.name}-${index}`} className="attachmentItem attachmentItem--pending">
              <PaperclipIcon size={16} />
              <span className="attachmentName">{file.name}</span>
              <span className="attachmentMeta">{formatFileSize(file.size, locale)}</span>
              <RemoveButton
                label={text.remove(file.name)}
                onClick={() => onPendingChange(pending.filter((_, position) => position !== index))}
              />
            </li>
          ))}
        </ul>
      )}
      {isLoading && <p className="formHint">{m.common.loading}</p>}
      {!isLoading && count === 0 && !canEdit && <p className="formHint">{text.empty}</p>}
      {canEdit && (
        <div className="attachmentAdd">
          <AddChip disabled={!canAdd} onClick={() => input.current?.click()}>
            {uploading.isPending ? text.uploading : `+ ${text.add}`}
          </AddChip>
          <span className="formHint">{text.hint(MAX_ATTACHMENTS, maxSize)}</span>
          <FileInput
            ref={input}
            multiple
            name="attachments"
            onChange={(event) => {
              add([...(event.target.files ?? [])])
              event.target.value = ''
            }}
          />
        </div>
      )}
      {pending.length > 0 && <p className="formHint">{text.pendingHint}</p>}
      {rejected.map((file) => (
        <p key={`${file.name}-${file.reason}`} className="errorText" role="alert">
          {file.reason === 'tooLarge'
            ? text.tooLarge(file.name, maxSize)
            : file.reason === 'empty'
              ? text.emptyFile(file.name)
              : text.tooMany(file.name, MAX_ATTACHMENTS)}
        </p>
      ))}
      <ErrorMessage
        message={
          (loadError ? getErrorMessage(loadError, m) : null) ?? uploading.error ?? removing.error ?? downloading.error
        }
      />
    </section>
  )
}
