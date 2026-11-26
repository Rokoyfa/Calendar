import { useRef, useState, type ReactNode, type SubmitEventHandler } from 'react'
import { Switch } from '../../../components/Switch.tsx'
import { SelectField } from '../../../components/SelectField.tsx'
import { useFeatures } from '../../../context/HostContext.ts'
import { useViewerTimeZone } from '../../../context/TimeZoneContext.ts'
import { useI18n } from '../../../i18n/index.ts'
import { SegmentedControl } from '../../../components/SegmentedControl.tsx'
import { Button } from '../../../components/Button.tsx'
import { DateTimeField } from '../../../components/DateTimeField.tsx'
import { Form } from '../../../components/Form.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { FormField } from '../../../components/FormField.tsx'
import { Modal } from '../../../components/Modal.tsx'
import { Tabs, type TabDefinition } from '../../../components/Tabs.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useLocationUrl } from '../../../hooks/useLocationUrl.ts'
import { MapPinIcon } from '../../../components/Icons.tsx'
import { isISODate, isTime } from '../../../utils/date.ts'
import {
  ALL_DAY_TIME,
  changesOnlyReminders,
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_LOCATION_MAX_LENGTH,
  formatEventPeriod,
  EVENT_TITLE_MAX_LENGTH,
  hasValidationErrors,
  moveToStartDate,
  normalizeEventInput,
  toViewerPeriod,
  validateEventInput,
  type EditScope,
  type EventInput,
  type EventOccurrence,
  type AttendeeStatus,
  type EventPeriod,
  type EventValidationErrors,
} from '../../../utils/event.ts'
import { adaptRecurrenceToStart, type Recurrence } from '../../../utils/recurrence.ts'
import type { EventModalMode } from '../types/eventModal.ts'
import { getScopeOptions } from '../utils/scopeOptions.ts'
import { ColorPicker } from './ColorPicker.tsx'
import { RecurrenceFields } from './RecurrenceFields.tsx'
import { RecurrenceScopeModal } from './RecurrenceScopeModal.tsx'
import { AttendeesField, type AttendeeCandidate } from './AttendeesField.tsx'
import { LinksField } from './LinksField.tsx'
import type { Category } from '../../../utils/category.ts'
import { isEventChanged } from '../../../utils/conflict.ts'
import type { SaveOptions } from '../hooks/useEvents.ts'
import { AttachmentsField, useAttachmentRepository } from '../../attachments/index.ts'
import { CategoryField } from '../../categories/index.ts'
import { ChatPanel, useUnreadCount } from '../../chat/index.ts'
import type { ChatKey } from '../../../utils/chat.ts'
import { ReminderField } from './ReminderField.tsx'
import { TimeZoneField } from './TimeZoneField.tsx'
import { HistoryPanel } from './HistoryPanel.tsx'
import { OverlapNotice, type OverlapCheck } from './OverlapNotice.tsx'
import { PlanConflictNotice, REPLAN_SUBMITTER, type PlanConflictCheck } from './PlanConflictNotice.tsx'
import { compact } from '../../../utils/list.ts'
import { RequestDecision, type RequestDecisionOptions } from './RequestDecision.tsx'
import { FindTimeModal, useFreeBusyRepository, type FoundTime } from '../../freebusy/index.ts'
import { convertWallTime, toInstant } from '../../../utils/timeZone.ts'

const DEFAULT_START = '09:00'
const DEFAULT_END = '10:00'

export type EventTab = 'general' | 'appearance' | 'recurrence' | 'attendees' | 'details' | 'chat' | 'history'

const TAB_FIELDS: Record<EventTab, readonly (keyof EventValidationErrors)[]> = {
  general: ['title', 'startDate', 'start', 'endDate', 'end', 'timeZone', 'reminders'],
  appearance: ['color'],
  recurrence: ['recurrence', 'excludedDates'],
  attendees: ['attendees'],
  details: ['location', 'links', 'description'],
  chat: [],
  history: [],
}

const LIVE_TABS: readonly EventTab[] = ['chat', 'history']

const NO_CATEGORIES: readonly Category[] = []

const NO_CHAT: ChatKey = { eventId: '', occurrenceDate: null }

const hasTabErrors = (errors: EventValidationErrors, tab: EventTab) =>
  TAB_FIELDS[tab].some((field) => errors[field] !== undefined)

const isValidPeriod = ({ startDate, start, endDate, end }: EventPeriod) =>
  isISODate(startDate) && isISODate(endDate) && isTime(start) && isTime(end)

const MS_PER_MINUTE = 60_000

const periodMinutes = ({ startDate, start, endDate, end }: EventPeriod, timeZone: string) =>
  Math.round(
    (toInstant({ date: endDate, time: end }, timeZone) - toInstant({ date: startDate, time: start }, timeZone)) /
      MS_PER_MINUTE,
  )

export type AttendeeOptions = {
  candidates: readonly AttendeeCandidate[]
  ownEmail: string | null
  onRespond?: (status: Exclude<AttendeeStatus, 'needsAction'>) => Promise<void>
}

export type CalendarChoice = { id: string; name: string }

export type CalendarFieldOptions = {
  value: string
  options: readonly CalendarChoice[]
  onChange: (calendarId: string) => void
}

type EventModalProps = {
  initialValue: EventInput
  calendarField?: CalendarFieldOptions
  attendeeOptions?: AttendeeOptions
  occurrence?: EventOccurrence | null
  notice?: string
  onSave: (input: EventInput, scope: EditScope, attachments: readonly File[], options?: SaveOptions) => Promise<void>
  onReload?: () => void
  remoteChange?: 'updated' | 'deleted' | null
  onDelete?: () => void | Promise<void>
  onDuplicate?: (input: EventInput) => void
  onRemindersChange?: (reminders: number[]) => Promise<void>
  chat?: { key: ChatKey; calendarId: string }
  history?: { eventId: string; calendarNames: ReadonlyMap<string, string> }
  showAttachments?: boolean
  initialTab?: EventTab
  categories?: readonly Category[]
  onCreateCategory?: (name: string) => Promise<Category>
  readOnly?: boolean
  canEditAttachments?: boolean
  checkOverlaps?: OverlapCheck
  planConflicts?: { check: PlanConflictCheck; onReplan: (taskId: string) => void }
  requestTo?: string
  showVisibility?: boolean
  decision?: RequestDecisionOptions
  onSwitchToTask?: (draft: { title: string; date: string | null }) => void
  onClose: () => void
}

type PendingSave = {
  input: EventInput
  options: EditScope[]
}

export function EventModal({
  initialValue,
  calendarField,
  attendeeOptions,
  occurrence = null,
  notice,
  onSave,
  onReload,
  remoteChange = null,
  onDelete,
  onDuplicate,
  onRemindersChange,
  chat,
  history,
  showAttachments = true,
  initialTab = 'general',
  categories = NO_CATEGORIES,
  onCreateCategory,
  readOnly = false,
  canEditAttachments = !readOnly,
  checkOverlaps,
  planConflicts,
  requestTo,
  showVisibility = false,
  decision,
  onSwitchToTask,
  onClose,
}: EventModalProps) {
  const i18n = useI18n()
  const { m } = i18n
  const features = useFeatures()
  const viewerTimeZone = useViewerTimeZone()
  const getLocationUrl = useLocationUrl()
  const mode: EventModalMode = occurrence ? 'edit' : 'create'
  const isRequest = requestTo !== undefined
  const isMoving = occurrence !== null && calendarField !== undefined && calendarField.value !== occurrence.calendarId
  const [values, setValues] = useState(initialValue)
  const [errors, setErrors] = useState<EventValidationErrors>({})
  const [pendingSave, setPendingSave] = useState<PendingSave | null>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const attachmentRepository = useAttachmentRepository()
  const [activeTab, setActiveTab] = useState<EventTab>(chat || initialTab !== 'chat' ? initialTab : 'general')
  const unreadChat = useUnreadCount(chat?.key ?? NO_CHAT)
  const [conflict, setConflict] = useState<{ input: EventInput; scope: EditScope } | null>(null)
  const replanRef = useRef<string | null>(null)
  const {
    run: save,
    isPending,
    error: submitError,
  } = useAsyncAction(async (input: EventInput, scope: EditScope, options: SaveOptions = {}) => {
    setConflict(null)
    const replanTaskId = replanRef.current
    try {
      if (occurrence && !isMoving && onRemindersChange && changesOnlyReminders(initialValue, input))
        await onRemindersChange(input.reminders)
      else await onSave(input, scope, pendingFiles, options)
      if (replanTaskId) planConflicts?.onReplan(replanTaskId)
    } catch (error) {
      if (!isEventChanged(error)) throw error
      setConflict({ input, scope })
    }
  })
  const { run: remove, isPending: isDeleting, error: deleteError } = useAsyncAction(async () => onDelete?.())
  const freeBusy = useFreeBusyRepository()
  const [isFindingTime, setFindingTime] = useState(false)

  const update = (changes: Partial<EventInput>, clearedErrors: readonly (keyof EventValidationErrors)[]) => {
    setValues((current) => ({ ...current, ...changes }))
    setErrors((current) => ({
      ...current,
      ...Object.fromEntries(clearedErrors.map((key) => [key, undefined])),
    }))
  }

  const setField = <K extends Exclude<keyof EventInput, 'recurrence'>>(field: K, value: EventInput[K]) =>
    update({ [field]: value }, [field])

  const [timedValues, setTimedValues] = useState(() =>
    initialValue.allDay
      ? { start: DEFAULT_START, end: DEFAULT_END, timeZone: viewerTimeZone }
      : {
          start: initialValue.start,
          end: initialValue.end,
          timeZone: initialValue.timeZone,
        },
  )

  const setAllDay = (allDay: boolean) => {
    if (allDay) {
      setTimedValues({
        start: values.start,
        end: values.end,
        timeZone: values.timeZone,
      })
      update({ allDay, start: ALL_DAY_TIME, end: ALL_DAY_TIME, timeZone: null }, ['start', 'end', 'endDate'])
    } else update({ allDay, ...timedValues }, ['start', 'end', 'endDate'])
  }

  const changeStartDate = (startDate: string) =>
    update(
      {
        ...(isISODate(values.startDate) && isISODate(values.endDate) && isISODate(startDate)
          ? moveToStartDate(values, startDate)
          : { startDate }),
        recurrence: adaptRecurrenceToStart(values.recurrence, values.startDate, startDate),
      },
      ['startDate', 'endDate'],
    )

  const setRecurrence = (recurrence: Recurrence | null) => update({ recurrence }, ['recurrence'])

  const eventTimeZone = values.timeZone ?? viewerTimeZone
  const canFindTime =
    freeBusy !== undefined &&
    attendeeOptions !== undefined &&
    !isRequest &&
    !readOnly &&
    !values.allDay &&
    values.attendees.length > 0 &&
    isValidPeriod(values)

  const applyFoundTime = (found: FoundTime) => {
    const first = convertWallTime({ date: found.startDate, time: found.start }, viewerTimeZone, eventTimeZone)
    const last = convertWallTime({ date: found.endDate, time: found.end }, viewerTimeZone, eventTimeZone)
    update(
      {
        startDate: first.date,
        start: first.time,
        endDate: last.date,
        end: last.time,
        recurrence: adaptRecurrenceToStart(values.recurrence, values.startDate, first.date),
      },
      ['startDate', 'start', 'endDate', 'end'],
    )
    setFindingTime(false)
    setActiveTab('general')
  }

  const findTimeButton = canFindTime && (
    <Button variant="outline" onClick={() => setFindingTime(true)}>
      {m.events.findTime.open}
    </Button>
  )

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    if (readOnly) return
    const submitter = event.nativeEvent.submitter
    replanRef.current =
      submitter instanceof HTMLButtonElement && submitter.name === REPLAN_SUBMITTER ? submitter.value : null
    const input = normalizeEventInput(values)
    const nextErrors = validateEventInput(input, m)
    setErrors(nextErrors)
    if (hasValidationErrors(nextErrors)) {
      const invalidTab = tabs.find(({ value }) => hasTabErrors(nextErrors, value))
      if (invalidTab && !hasTabErrors(nextErrors, activeTab)) setActiveTab(invalidTab.value)
      return
    }

    const options = getScopeOptions(occurrence, input.recurrence)
    if (isMoving) void save(input, 'all')
    else if (occurrence && onRemindersChange && changesOnlyReminders(initialValue, input)) void save(input, 'all')
    else if (options.length > 1) setPendingSave({ input, options })
    else void save(input, options[0])
  }

  const handleScopeSelect = (scope: EditScope) => {
    if (!pendingSave) return
    setPendingSave(null)
    void save(pendingSave.input, scope)
  }

  const viewerHint =
    !values.allDay && values.timeZone && values.timeZone !== viewerTimeZone && isValidPeriod(values)
      ? m.events.inYourTimeZone(formatEventPeriod(toViewerPeriod(values, values.timeZone, viewerTimeZone), i18n))
      : null

  const locationUrl = getLocationUrl(values.location)

  const tabDefinitions = compact<TabDefinition<EventTab> & { after?: ReactNode }>([
    {
      value: 'general',
      label: m.events.tabs.general,
      content: (
        <>
          <TextField
            label={m.events.title}
            name="title"
            autoComplete="off"
            maxLength={EVENT_TITLE_MAX_LENGTH}
            value={values.title}
            error={errors.title}
            onChange={(title) => setField('title', title)}
            data-autofocus
          />

          {calendarField && calendarField.options.length > 1 && !readOnly && (
            <SelectField
              label={m.events.calendar}
              name="calendarId"
              value={calendarField.value}
              options={calendarField.options.map(({ id, name }) => ({ value: id, label: name }))}
              onChange={(calendarId) => {
                calendarField.onChange(calendarId)
                setField('categoryIds', [])
              }}
            />
          )}
          {isMoving && occurrence?.recurrence && <p className="formHint">{m.events.moveSeriesHint}</p>}

          <Switch label={m.events.allDay} checked={values.allDay} onChange={setAllDay} />

          <DateTimeField
            name="start"
            dateLabel={m.events.startDate}
            timeLabel={m.events.startTime}
            date={values.startDate}
            time={values.start}
            showTime={!values.allDay}
            dateError={errors.startDate}
            timeError={errors.start}
            onDateChange={changeStartDate}
            onTimeChange={(start) => setField('start', start)}
          />

          <DateTimeField
            name="end"
            dateLabel={m.events.endDate}
            timeLabel={m.events.endTime}
            date={values.endDate}
            time={values.end}
            showTime={!values.allDay}
            minDate={values.startDate}
            dateError={errors.endDate}
            timeError={errors.end}
            onDateChange={(endDate) => setField('endDate', endDate)}
            onTimeChange={(end) => setField('end', end)}
          />

          {!values.allDay && features.timeZones && (
            <TimeZoneField value={values.timeZone} onChange={(timeZone) => setField('timeZone', timeZone)} />
          )}
          {viewerHint && <p className="formHint">{viewerHint}</p>}
          {checkOverlaps && !readOnly && <OverlapNotice values={values} check={checkOverlaps} />}
          {planConflicts && !readOnly && !isRequest && !values.taskId && (
            <PlanConflictNotice
              values={values}
              check={planConflicts.check}
              canReplan={!isMoving}
              isPending={isPending}
            />
          )}
          {findTimeButton}

          {features.reminders && !readOnly && !isRequest && (
            <ReminderField value={values.reminders} onChange={(reminders) => setField('reminders', reminders)} />
          )}
          {showVisibility && !isRequest && (
            <>
              <Switch
                label={m.peers.visibility}
                checked={values.visibility === 'public'}
                onChange={(shown) => setField('visibility', shown ? 'public' : 'private')}
              />
              <p className="formHint">{m.peers.visibilityHint}</p>
            </>
          )}
        </>
      ),
    },
    !isRequest && {
      value: 'appearance',
      label: m.events.tabs.appearance,
      content: (
        <>
          <ColorPicker value={values.color} onChange={(color) => setField('color', color)} />
          <CategoryField
            categories={categories}
            value={values.categoryIds}
            builtin={values.builtinCategories ?? []}
            onChange={(categoryIds) => setField('categoryIds', categoryIds)}
            onBuiltinChange={(builtinCategories) => setField('builtinCategories', builtinCategories)}
            onCreate={readOnly ? undefined : onCreateCategory}
          />
        </>
      ),
    },
    features.recurrence &&
      !isRequest && {
        value: 'recurrence',
        label: m.events.tabs.recurrence,
        content: (
          <RecurrenceFields
            value={values.recurrence}
            startDate={values.startDate}
            errors={errors.recurrence ?? {}}
            onChange={setRecurrence}
          />
        ),
      },
    attendeeOptions &&
      !isRequest &&
      (attendeeOptions.candidates.length > 0 || values.attendees.length > 0) && {
        value: 'attendees',
        label: m.calendars.settings.withCount(m.events.tabs.attendees, values.attendees.length),
        content: (
          <>
            <AttendeesField
              attendees={values.attendees}
              candidates={attendeeOptions.candidates}
              ownEmail={attendeeOptions.ownEmail}
              onChange={(attendees) => setField('attendees', attendees)}
              onRespond={occurrence ? attendeeOptions.onRespond : undefined}
            />
            {findTimeButton}
          </>
        ),
      },
    {
      value: 'details',
      label: m.events.tabs.details,
      content: (
        <>
          <TextField
            label={m.events.location}
            name="location"
            autoComplete="off"
            maxLength={EVENT_LOCATION_MAX_LENGTH}
            value={values.location}
            error={errors.location}
            onChange={(location) => setField('location', location)}
            addon={
              locationUrl && (
                <a
                  className="iconButton iconButton--plain"
                  href={locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={m.events.openMap(values.location.trim())}
                  title={m.events.openMap(values.location.trim())}
                >
                  <MapPinIcon size={18} />
                </a>
              )
            }
          />

          {features.links && !isRequest && (
            <LinksField links={values.links} error={errors.links} onChange={(links) => setField('links', links)} />
          )}

          <FormField label={isRequest ? m.peers.note : m.events.description} error={errors.description}>
            <textarea
              className="textarea eventDescription"
              name="description"
              maxLength={EVENT_DESCRIPTION_MAX_LENGTH}
              value={values.description}
              onChange={(event) => setField('description', event.target.value)}
            />
          </FormField>
        </>
      ),
      after: attachmentRepository && showAttachments && !isRequest && (
        <AttachmentsField
          eventId={occurrence?.id ?? null}
          canEdit={canEditAttachments}
          pending={pendingFiles}
          onPendingChange={setPendingFiles}
        />
      ),
    },
    chat && {
      value: 'chat',
      label: m.calendars.settings.withCount(m.events.chat.tab, unreadChat),
      content: <ChatPanel chatKey={chat.key} calendarId={chat.calendarId} isActive={activeTab === 'chat'} />,
    },
    history && {
      value: 'history',
      label: m.events.history.tab,
      content: (
        <HistoryPanel
          eventId={history.eventId}
          calendarNames={history.calendarNames}
          isActive={activeTab === 'history'}
        />
      ),
    },
  ])
  const tabs = tabDefinitions.map(({ after, ...tab }) => ({
    ...tab,
    content: (
      <>
        {readOnly && !LIVE_TABS.includes(tab.value) ? (
          <fieldset className="readOnlyFields" disabled>
            {tab.content}
          </fieldset>
        ) : (
          tab.content
        )}
        {after}
      </>
    ),
    invalid: hasTabErrors(errors, tab.value),
  }))

  return (
    <>
      <Modal
        title={
          isRequest
            ? mode === 'create'
              ? m.peers.requestTitle
              : m.peers.editRequestTitle
            : readOnly
              ? m.events.viewTitle
              : mode === 'create'
                ? m.events.createTitle
                : m.events.editTitle
        }
        onClose={onClose}
      >
        <Form className="eventForm" onSubmit={handleSubmit}>
          {mode === 'create' && onSwitchToTask && (
            <SegmentedControl
              label={m.tasks.kind.label}
              value="event"
              options={[
                { value: 'event', label: m.tasks.kind.event },
                { value: 'task', label: m.tasks.kind.task },
              ]}
              onChange={(kind) => {
                if (kind === 'task')
                  onSwitchToTask({
                    title: values.title.trim(),
                    date: isISODate(values.startDate) ? values.startDate : null,
                  })
              }}
            />
          )}
          {notice && <p className="formHint eventNotice">{notice}</p>}
          {decision && <RequestDecision {...decision} />}
          <Tabs label={m.events.tabsLabel} tabs={tabs} value={activeTab} stable onChange={setActiveTab} />

          <ErrorMessage message={submitError ?? deleteError} />
          {remoteChange && !conflict && (
            <div className="eventConflict" role="status">
              <p>{remoteChange === 'deleted' ? m.events.remoteChange.deleted : m.events.remoteChange.updated}</p>
              {onReload && (
                <div className="buttonRow">
                  <Button variant="secondary" onClick={onReload}>
                    {m.events.remoteChange.reload}
                  </Button>
                </div>
              )}
            </div>
          )}
          {conflict && (
            <div className="eventConflict" role="alert">
              <p>{m.events.conflict.message}</p>
              <div className="buttonRow">
                <Button
                  variant="outline"
                  isPending={isPending}
                  onClick={() => void save(conflict.input, conflict.scope, { force: true })}
                >
                  {m.events.conflict.overwrite}
                </Button>
                {onReload && (
                  <Button variant="secondary" onClick={onReload}>
                    {m.events.conflict.reload}
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="modalActions">
            {!readOnly && (
              <Button type="submit" isPending={isPending} pendingLabel={m.common.saving}>
                {isRequest && mode === 'create' ? m.peers.sendRequest : m.common.save}
              </Button>
            )}
            {onDelete && (!readOnly || isRequest) && (
              <Button variant="danger" disabled={isPending} isPending={isDeleting} onClick={() => void remove()}>
                {isRequest ? m.peers.withdraw : m.common.delete}
              </Button>
            )}
            {onDuplicate && !readOnly && !isRequest && (
              <Button variant="outline" disabled={isPending || isDeleting} onClick={() => onDuplicate(values)}>
                {m.events.duplicate}
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>
              {readOnly ? m.common.close : m.common.cancel}
            </Button>
          </div>
        </Form>
      </Modal>

      {isFindingTime && canFindTime && (
        <FindTimeModal
          people={values.attendees}
          ownEmail={attendeeOptions.ownEmail}
          initialDate={values.startDate}
          durationMinutes={periodMinutes(values, eventTimeZone)}
          excludeEventId={occurrence && !occurrence.recurrence ? occurrence.id : undefined}
          onPick={applyFoundTime}
          onClose={() => setFindingTime(false)}
        />
      )}

      {pendingSave && (
        <RecurrenceScopeModal
          options={pendingSave.options}
          onSelect={handleScopeSelect}
          onClose={() => setPendingSave(null)}
        />
      )}
    </>
  )
}
