import { useCallback, useMemo, useState } from 'react'
import {
  createAllDayEventInput,
  createEventInput,
  createEventInputForSlots,
  toOccurrenceInput,
  type EventInput,
  type EventOccurrence,
} from '../../../domain/event.ts'
import type { EventTab } from '../../events/index.ts'
import type { EditorState } from '../types/editor.ts'
import type { SlotRange } from '../utils/slotSelection.ts'

export type OpenEventRequest = {
  eventId: string
  date: string
  tab?: EventTab
}

type RemoteChange = { eventId: string; version: number | null }

type EventEditorOptions = {
  occurrences: readonly EventOccurrence[]
  canCreate: boolean
  viewerTimeZone: string
  linkedEvent?: OpenEventRequest
  onLinkedEventDone?: () => void
}

const findRequested = (occurrences: readonly EventOccurrence[], request: OpenEventRequest) =>
  occurrences.find(
    (occurrence) =>
      (occurrence.id === request.eventId && occurrence.occurrenceDate === request.date) ||
      (occurrence.seriesId === request.eventId && occurrence.originalDate === request.date) ||
      (occurrence.id === request.eventId && !occurrence.recurrence),
  ) ?? null

export function useEventEditor({
  occurrences,
  canCreate,
  viewerTimeZone,
  linkedEvent,
  onLinkedEventDone,
}: EventEditorOptions) {
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [hostRequest, setHostRequest] = useState<OpenEventRequest | null>(null)
  const [remoteChange, setRemoteChange] = useState<RemoteChange | null>(null)
  const request = hostRequest ?? linkedEvent

  const requestedOccurrence = useMemo(
    () => (request ? findRequested(occurrences, request) : null),
    [request, occurrences],
  )
  const shown: EditorState | null =
    editor ??
    (requestedOccurrence && {
      initialValue: toOccurrenceInput(requestedOccurrence),
      occurrence: requestedOccurrence,
      initialTab: request?.tab,
    })

  const openDraft = useCallback(
    (initialValue: EventInput, notice?: string) => {
      if (canCreate) setEditor({ initialValue, occurrence: null, notice })
    },
    [canCreate],
  )
  const openCreate = useCallback(
    (date: string, hour: number) => openDraft(createEventInput(date, hour, viewerTimeZone)),
    [openDraft, viewerTimeZone],
  )
  const openCreateRange = useCallback(
    ({ first, last }: SlotRange) => openDraft(createEventInputForSlots(first, last, viewerTimeZone)),
    [openDraft, viewerTimeZone],
  )
  const openCreateAllDay = useCallback((date: string) => openDraft(createAllDayEventInput(date)), [openDraft])
  const openEdit = useCallback((occurrence: EventOccurrence, initialTab?: EventTab) => {
    setEditor({ initialValue: toOccurrenceInput(occurrence), occurrence, initialTab })
  }, [])

  const finishRequest = () => {
    if (hostRequest) setHostRequest(null)
    else if (linkedEvent) onLinkedEventDone?.()
  }

  const close = () => {
    setEditor(null)
    setRemoteChange(null)
    finishRequest()
  }

  const openFromHost = (eventId: string, date: string) => {
    setEditor(null)
    setHostRequest({ eventId, date })
  }

  const duplicate = (initialValue: EventInput, notice: string) => {
    finishRequest()
    openDraft(initialValue, notice)
  }

  const setCalendarId = (calendarId: string) => setEditor((current) => (current ? { ...current, calendarId } : current))

  const noteRemoteChange = (change: RemoteChange) => {
    if (shown?.occurrence?.id === change.eventId) setRemoteChange(change)
  }

  const occurrence = shown?.occurrence
  const remoteState: 'updated' | 'deleted' | null =
    occurrence && remoteChange?.eventId === occurrence.id
      ? remoteChange.version === null
        ? 'deleted'
        : remoteChange.version > occurrence.version
          ? 'updated'
          : null
      : null

  return {
    shown,
    remoteState,
    openDraft,
    openCreate,
    openCreateRange,
    openCreateAllDay,
    openEdit,
    openFromHost,
    duplicate,
    setCalendarId,
    noteRemoteChange,
    close,
  }
}
