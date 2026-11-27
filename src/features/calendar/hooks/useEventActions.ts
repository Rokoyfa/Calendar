import { useState } from 'react'
import { useHost } from '../../../context/HostContext.ts'
import {
  toViewerPeriod,
  type EditScope,
  type EventInput,
  type EventOccurrence,
  type EventPeriod,
} from '../../../domain/event.ts'
import { useI18n } from '../../../i18n/index.ts'
import { useAttachmentRepository } from '../../attachments/index.ts'
import { getScopeOptions, type SaveOptions, type useEvents } from '../../events/index.ts'
import { useStorage } from '../../storage/index.ts'
import { toDropInput } from '../utils/eventDrag.ts'
import type { DragPreview } from './useEventDrag.ts'
import type { useUndo } from './useUndo.ts'

type PendingDrop = {
  occurrence: EventOccurrence
  period: EventPeriod
  options: EditScope[]
}

type EventActionOptions = {
  events: ReturnType<typeof useEvents>
  undo: ReturnType<typeof useUndo>
  attempt: (action: () => Promise<unknown>) => Promise<boolean>
  setError: (message: string | null) => void
  editedOccurrence: EventOccurrence | null | undefined
  targetCalendarId: string
  viewerTimeZone: string
  closeEditor: () => void
  goToDate: (date: string) => void
  setDragPreview: (preview: DragPreview | null) => void
}

export function useEventActions({
  events: { createEvent, updateEvent, deleteEvent, moveEvent },
  undo,
  attempt,
  setError,
  editedOccurrence,
  targetCalendarId,
  viewerTimeZone,
  closeEditor,
  goToDate,
  setDragPreview,
}: EventActionOptions) {
  const i18n = useI18n()
  const { features } = useHost()
  const { invalidate } = useStorage()
  const attachmentRepository = useAttachmentRepository()
  const [eventToDelete, setEventToDelete] = useState<EventOccurrence | null>(null)
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null)

  const removeEvent = async (occurrence: EventOccurrence, scope: EditScope) => {
    const revert = await deleteEvent(occurrence, scope)
    setEventToDelete(null)
    closeEditor()
    undo.offerUndo(i18n.m.calendar.undo.deleted(occurrence.title), revert)
  }

  const requestDelete = async (occurrence: EventOccurrence) => {
    if (!features.undo || getScopeOptions(occurrence).length > 1) setEventToDelete(occurrence)
    else await removeEvent(occurrence, 'all')
  }

  const uploadAttachments = async (eventId: string, files: readonly File[]) => {
    if (!attachmentRepository || files.length === 0) return
    const failed: string[] = []
    for (const file of files) {
      try {
        await attachmentRepository.upload(eventId, file)
      } catch {
        failed.push(file.name)
      }
    }
    invalidate()
    if (failed.length > 0) setError(i18n.m.events.attachments.notUploaded(failed.join(', ')))
  }

  const save = async (
    target: string | null,
    input: EventInput,
    scope: EditScope,
    attachments: readonly File[],
    options?: SaveOptions,
  ) => {
    const calendarId = target ?? targetCalendarId
    if (editedOccurrence) {
      await updateEvent(editedOccurrence, input, scope, options)
      if (moveEvent && calendarId !== editedOccurrence.calendarId) {
        const moved = await moveEvent(editedOccurrence, calendarId, false)
        undo.offerUndo(i18n.m.calendar.undo.moved(input.title), moved.undo)
      }
    } else await uploadAttachments((await createEvent(input, calendarId)).id, attachments)
    closeEditor()
    goToDate(toViewerPeriod(input, input.timeZone, viewerTimeZone).startDate)
  }

  const saveDrop = async (occurrence: EventOccurrence, period: EventPeriod, scope: EditScope) => {
    setPendingDrop(null)
    await attempt(async () => {
      const revert = await updateEvent(occurrence, toDropInput(occurrence, period, viewerTimeZone, scope), scope)
      undo.offerUndo(i18n.m.calendar.undo.moved(occurrence.title), revert)
    })
    setDragPreview(null)
  }

  const drop = (occurrence: EventOccurrence, period: EventPeriod) => {
    setDragPreview({ occurrenceKey: occurrence.occurrenceKey, period })
    const options = getScopeOptions(occurrence)
    if (options.length > 1) setPendingDrop({ occurrence, period, options })
    else void saveDrop(occurrence, period, options[0])
  }

  const cancelDrop = () => {
    setPendingDrop(null)
    setDragPreview(null)
  }

  return {
    eventToDelete,
    cancelDelete: () => setEventToDelete(null),
    removeEvent,
    requestDelete,
    save,
    pendingDrop,
    drop,
    saveDrop,
    cancelDrop,
  }
}
