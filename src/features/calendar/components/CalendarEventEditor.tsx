import { Suspense } from 'react'
import { useHost } from '../../../context/HostContext.ts'
import type { Category } from '../../../domain/category.ts'
import type { CalendarEvent, EditScope, EventInput, EventOccurrence } from '../../../domain/event.ts'
import { useI18n } from '../../../i18n/index.ts'
import { isCaldavCalendarId } from '../../caldav/index.ts'
import { getChatKey, type ChatAccess } from '../../chat/index.ts'
import {
  LazyEventModal as EventModal,
  type AttendeeCandidate,
  type CalendarChoice,
  type OverlapCheck,
  type PlanConflictCheck,
  type SaveOptions,
  type useEvents,
} from '../../events/index.ts'
import { shareIdOf, usePeerCalendars } from '../../peers/index.ts'
import { useStorage } from '../../storage/index.ts'
import type { useEventEditor } from '../hooks/useEventEditor.ts'
import type { EditorState } from '../types/editor.ts'
import type { EventSources } from '../types/eventSource.ts'
import { getEditorAccess, withCurrentCalendar } from '../utils/editorAccess.ts'
import { getSourceText } from '../utils/eventLabels.ts'

type Events = ReturnType<typeof useEvents>

type CalendarEventEditorProps = {
  editor: ReturnType<typeof useEventEditor>
  shown: EditorState
  calendarId: string
  readOnly: boolean
  canCreate: boolean
  supportsMove: boolean
  canEditEvent: (event: CalendarEvent) => boolean
  canMoveEvent: (event: CalendarEvent) => boolean
  calendarChoices: readonly CalendarChoice[]
  calendarNames: ReadonlyMap<string, string>
  eventSources: EventSources
  categories: readonly Category[]
  hasCategories: boolean
  canManageCategories: (calendarId: string) => boolean
  createCategory: (calendarId: string, name: string) => Promise<Category>
  checkOverlaps: OverlapCheck
  planConflicts: {
    calendarIds: ReadonlySet<string> | null
    check: PlanConflictCheck
    onReplan: (taskId: string) => void
  }
  attendeeCandidates: readonly AttendeeCandidate[]
  currentUserEmail: string | null
  respond: Events['respond']
  setReminders: Events['setReminders']
  canSetVisibility: (calendarId: string) => boolean
  isHistoryAvailable: (calendarId: string) => boolean
  chat?: ChatAccess
  onSwitchToTask?: (draft: { title: string; date: string | null }) => void
  onSave: (input: EventInput, scope: EditScope, attachments: readonly File[], options?: SaveOptions) => Promise<void>
  onDelete: (occurrence: EventOccurrence) => void | Promise<void>
  onDuplicate: (input: EventInput) => void
}

export function CalendarEventEditor({
  editor,
  shown,
  calendarId,
  readOnly,
  canCreate,
  supportsMove,
  canEditEvent,
  canMoveEvent,
  calendarChoices,
  calendarNames,
  eventSources,
  categories,
  hasCategories,
  canManageCategories,
  createCategory,
  checkOverlaps,
  planConflicts,
  attendeeCandidates,
  currentUserEmail,
  respond,
  setReminders,
  canSetVisibility,
  isHistoryAvailable,
  chat,
  onSwitchToTask,
  onSave,
  onDelete,
  onDuplicate,
}: CalendarEventEditorProps) {
  const i18n = useI18n()
  const { features } = useHost()
  const { invalidate, personalSharing } = useStorage()
  const peers = usePeerCalendars()
  const closeEditor = editor.close
  const occurrence = shown.occurrence
  const source = occurrence ? eventSources.get(occurrence.calendarId) : undefined
  const { isExternal, isCaldav, isPeer, isLocked, canChooseCalendar } = getEditorAccess({
    occurrence,
    readOnly,
    canCreate,
    supportsMove,
    canEditEvent,
    canMoveEvent,
  })
  const calendarField = canChooseCalendar
    ? {
        value: calendarId,
        options: withCurrentCalendar(
          calendarChoices,
          occurrence,
          occurrence
            ? (calendarNames.get(occurrence.calendarId) ?? eventSources.get(occurrence.calendarId)?.name ?? '')
            : '',
        ),
        onChange: editor.setCalendarId,
      }
    : undefined
  const peerShareId = shareIdOf(calendarId)
  const peerOwner = peerShareId
    ? (peers.calendars.find((calendar) => calendar.id === peerShareId)?.ownerName ?? '')
    : undefined
  const request = occurrence?.request ?? null
  const isOwnRequest = isPeer && request?.mine === true
  const isForeign = isExternal || isCaldav || isPeer
  const isEditable = !readOnly && !isExternal && !isLocked
  const peerNotice =
    peerOwner === undefined
      ? undefined
      : !occurrence
        ? i18n.m.peers.requestHint(peerOwner)
        : isOwnRequest
          ? request?.status === 'pending'
            ? i18n.m.peers.requestPending(peerOwner)
            : i18n.m.peers.requestAccepted(peerOwner)
          : i18n.m.peers.eventNotice(peerOwner)
  const decision =
    personalSharing && occurrence && !isPeer && request?.status === 'pending' && !readOnly
      ? {
          requester: request.requester?.name ?? null,
          onAccept: async () => {
            await personalSharing.acceptRequest(occurrence.id)
            closeEditor()
            invalidate()
          },
          onDecline: async () => {
            await personalSharing.declineRequest(occurrence.id)
            closeEditor()
            invalidate()
          },
        }
      : undefined
  const requesterNotice =
    !isPeer && request?.status === 'accepted' && request.requester
      ? i18n.m.peers.decision.acceptedBy(request.requester.name)
      : undefined

  return (
    <Suspense fallback={null}>
      <EventModal
        readOnly={readOnly || isExternal || isLocked}
        showAttachments={!isForeign}
        history={
          features.history && occurrence && !isForeign && isHistoryAvailable(occurrence.calendarId)
            ? { eventId: occurrence.id, calendarNames }
            : undefined
        }
        canEditAttachments={!readOnly && (!occurrence || canEditEvent(occurrence))}
        categories={categories.filter((category) => category.calendarId === calendarId)}
        onCreateCategory={
          hasCategories && canManageCategories(calendarId) ? (name) => createCategory(calendarId, name) : undefined
        }
        calendarField={calendarField}
        checkOverlaps={features.overlapWarnings && isEditable ? checkOverlaps : undefined}
        planConflicts={
          planConflicts.calendarIds?.has(calendarId) && isEditable
            ? { check: planConflicts.check, onReplan: planConflicts.onReplan }
            : undefined
        }
        initialValue={shown.initialValue}
        occurrence={occurrence}
        attendeeOptions={
          features.attendees
            ? {
                candidates: attendeeCandidates,
                ownEmail: currentUserEmail,
                onRespond:
                  respond && occurrence && !isExternal && !isPeer ? (status) => respond(occurrence, status) : undefined,
              }
            : undefined
        }
        requestTo={peerOwner}
        showVisibility={features.personalSharing && Boolean(personalSharing) && canSetVisibility(calendarId)}
        decision={decision}
        onSwitchToTask={
          onSwitchToTask && !occurrence && !isPeer && !isCaldavCalendarId(calendarId) ? onSwitchToTask : undefined
        }
        notice={
          shown.notice ??
          peerNotice ??
          requesterNotice ??
          (isExternal && source
            ? i18n.m.external.eventNotice(source.name)
            : isCaldav && source
              ? i18n.m.caldav.eventNotice(source.name)
              : source && i18n.m.calendar.sharedEventNotice(getSourceText(source, i18n)))
        }
        onSave={onSave}
        remoteChange={editor.remoteState}
        onReload={() => {
          closeEditor()
          invalidate()
        }}
        onDelete={occurrence && !isExternal && (!isPeer || isOwnRequest) ? () => onDelete(occurrence) : undefined}
        chat={
          occurrence && !isExternal && chat?.isAvailable(occurrence.calendarId)
            ? { key: getChatKey(occurrence), calendarId: occurrence.calendarId }
            : undefined
        }
        initialTab={shown.initialTab}
        onDuplicate={features.duplicate && occurrence && canCreate && !isPeer ? onDuplicate : undefined}
        onRemindersChange={
          setReminders && occurrence && !isExternal && !isPeer
            ? async (reminders) => {
                await setReminders(occurrence, reminders)
                closeEditor()
              }
            : undefined
        }
        onClose={closeEditor}
      />
    </Suspense>
  )
}
