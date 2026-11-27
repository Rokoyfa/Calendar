import { useCallback, useEffect, useState } from 'react'
import { useFeatures } from '../../../context/HostContext.ts'
import { AppError } from '../../../utils/appError.ts'
import type { Attachment } from '../utils/attachment.ts'
import { saveBlob } from '../../../utils/download.ts'
import { useStorage } from '../../storage/index.ts'
import { removeById } from '../../../utils/list.ts'

type Loaded = { eventId: string; attachments: Attachment[] }

export function useAttachmentRepository() {
  const { attachments } = useStorage()
  const { attachments: enabled } = useFeatures()
  return enabled ? (attachments ?? null) : null
}

export function useAttachments(eventId: string | null) {
  const repository = useAttachmentRepository()
  const { invalidate } = useStorage()
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [loadError, setLoadError] = useState<unknown>(null)

  useEffect(() => {
    if (!repository || !eventId) return
    let isCurrent = true
    repository
      .list(eventId)
      .then((attachments) => {
        if (isCurrent) setLoaded({ eventId, attachments })
      })
      .catch((error: unknown) => {
        if (isCurrent) setLoadError(error)
      })
    return () => {
      isCurrent = false
    }
  }, [repository, eventId])

  const attachments = loaded && loaded.eventId === eventId ? loaded.attachments : []
  const isLoading = Boolean(repository && eventId) && loaded?.eventId !== eventId && loadError === null

  const change = useCallback(
    (update: (current: Attachment[]) => Attachment[]) =>
      setLoaded((current) =>
        current && current.eventId === eventId ? { eventId, attachments: update(current.attachments) } : current,
      ),
    [eventId],
  )

  const upload = useCallback(
    async (files: readonly File[]) => {
      if (!repository || !eventId) throw new AppError('unknown')
      try {
        for (const file of files) {
          const attachment = await repository.upload(eventId, file)
          change((current) => [...current, attachment])
        }
      } finally {
        invalidate()
      }
    },
    [repository, eventId, change, invalidate],
  )

  const remove = useCallback(
    async (attachment: Attachment) => {
      if (!repository) throw new AppError('unknown')
      await repository.remove(attachment.id)
      change((current) => removeById(current, attachment.id))
      invalidate()
    },
    [repository, change, invalidate],
  )

  const download = useCallback(
    async (attachment: Attachment) => {
      if (!repository) throw new AppError('unknown')
      saveBlob(await repository.download(attachment), attachment.name)
    },
    [repository],
  )

  return { isAvailable: repository !== null, attachments, isLoading, loadError, upload, remove, download }
}
