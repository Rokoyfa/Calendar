import { useState, type SubmitEventHandler } from 'react'
import { Switch } from '../../../components/Switch.tsx'
import { useViewerTimeZone } from '../../../context/TimeZoneContext.ts'
import { useI18n } from '../../../i18n/index.ts'
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
import { ChatPanel, useUnreadCount } from '../../chat/index.ts'
import type { ChatKey } from '../../../utils/chat.ts'
import { ReminderField } from './ReminderField.tsx'
import { TimeZoneField } from './TimeZoneField.tsx'

const DEFAULT_START = '09:00'
const DEFAULT_END = '10:00'

export type EventTab = 'general' | 'recurrence' | 'attendees' | 'details' | 'chat'

const TAB_FIELDS: Record<EventTab, readonly (keyof EventValidationErrors)[]> = {
  general: ['title', 'startDate', 'start', 'endDate', 'end', 'timeZone', 'reminders', 'color'],
  recurrence: ['recurrence', 'excludedDates'],
  attendees: ['attendees'],
  details: ['location', 'links', 'description'],
  chat: [],
}

const NO_CHAT: ChatKey = { eventId: '', occurrenceDate: null }

const hasTabErrors = (errors: EventValidationErrors, tab: EventTab) =>
  TAB_FIELDS[tab].some((field) => errors[field] !== undefined)

const isValidPeriod = ({ startDate, start, endDate, end }: EventPeriod) =>
  isISODate(startDate) && isISODate(endDate) && isTime(start) && isTime(end)

export type AttendeeOptions = {
  candidates: readonly AttendeeCandidate[]
  ownEmail: string | null
  onRespond?: (status: Exclude<AttendeeStatus, 'needsAction'>) => Promise<void>
}

type EventModalProps = {
  initialValue: EventInput
  attendeeOptions?: AttendeeOptions
  occurrence?: EventOccurrence | null
  notice?: string
  onSave: (input: EventInput, scope: EditScope) => Promise<void>
  onDelete?: () => void | Promise<void>
  onDuplicate?: (input: EventInput) => void
  onRemindersChange?: (reminders: number[]) => Promise<void>
  chat?: { key: ChatKey; calendarId: string }
  initialTab?: EventTab
  onClose: () => void
}

type PendingSave = {
  input: EventInput
  options: EditScope[]
}

export function EventModal({
  initialValue,
  attendeeOptions,
  occurrence = null,
  notice,
  onSave,
  onDelete,
  onDuplicate,
  onRemindersChange,
  chat,
  initialTab = 'general',
  onClose,
}: EventModalProps) {
  const i18n = useI18n()
  const { m } = i18n
  const viewerTimeZone = useViewerTimeZone()
  const getLocationUrl = useLocationUrl()
  const mode: EventModalMode = occurrence ? 'edit' : 'create'
  const [values, setValues] = useState(initialValue)
  const [errors, setErrors] = useState<EventValidationErrors>({})
  const [pendingSave, setPendingSave] = useState<PendingSave | null>(null)
  const [activeTab, setActiveTab] = useState<EventTab>(chat || initialTab !== 'chat' ? initialTab : 'general')
  const unreadChat = useUnreadCount(chat?.key ?? NO_CHAT)
  const {
    run: save,
    isPending,
    error: submitError,
  } = useAsyncAction(async (input: EventInput, scope: EditScope) => {
    if (occurrence && onRemindersChange && changesOnlyReminders(initialValue, input))
      await onRemindersChange(input.reminders)
    else await onSave(input, scope)
  })
  const { run: remove, isPending: isDeleting, error: deleteError } = useAsyncAction(async () => onDelete?.())

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

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    const input = normalizeEventInput(values)
    const nextErrors = validateEventInput(input, m)
    setErrors(nextErrors)
    if (hasValidationErrors(nextErrors)) {
      const invalidTab = tabs.find(({ value }) => hasTabErrors(nextErrors, value))
      if (invalidTab && !hasTabErrors(nextErrors, activeTab)) setActiveTab(invalidTab.value)
      return
    }

    const options = getScopeOptions(occurrence, input.recurrence)
    if (occurrence && onRemindersChange && changesOnlyReminders(initialValue, input)) void save(input, 'all')
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

  const tabDefinitions: TabDefinition<EventTab>[] = [
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

          {!values.allDay && (
            <TimeZoneField value={values.timeZone} onChange={(timeZone) => setField('timeZone', timeZone)} />
          )}
          {viewerHint && <p className="formHint">{viewerHint}</p>}

          <ReminderField value={values.reminders} onChange={(reminders) => setField('reminders', reminders)} />

          <ColorPicker value={values.color} onChange={(color) => setField('color', color)} />
        </>
      ),
    },
    {
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
  ]
  if (attendeeOptions && (attendeeOptions.candidates.length > 0 || values.attendees.length > 0))
    tabDefinitions.push({
      value: 'attendees',
      label: m.calendars.settings.withCount(m.events.tabs.attendees, values.attendees.length),
      content: (
        <AttendeesField
          attendees={values.attendees}
          candidates={attendeeOptions.candidates}
          ownEmail={attendeeOptions.ownEmail}
          onChange={(attendees) => setField('attendees', attendees)}
          onRespond={occurrence ? attendeeOptions.onRespond : undefined}
        />
      ),
    })
  tabDefinitions.push({
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

        <LinksField links={values.links} error={errors.links} onChange={(links) => setField('links', links)} />

        <FormField label={m.events.description} error={errors.description}>
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
  })
  if (chat)
    tabDefinitions.push({
      value: 'chat',
      label: m.calendars.settings.withCount(m.events.chat.tab, unreadChat),
      content: <ChatPanel chatKey={chat.key} calendarId={chat.calendarId} isActive={activeTab === 'chat'} />,
    })
  const tabs = tabDefinitions.map((tab) => ({ ...tab, invalid: hasTabErrors(errors, tab.value) }))

  return (
    <>
      <Modal title={mode === 'create' ? m.events.createTitle : m.events.editTitle} onClose={onClose}>
        <Form className="eventForm" onSubmit={handleSubmit}>
          {notice && <p className="formHint eventNotice">{notice}</p>}
          <Tabs label={m.events.tabsLabel} tabs={tabs} value={activeTab} stable onChange={setActiveTab} />

          <ErrorMessage message={submitError ?? deleteError} />

          <div className="modalActions">
            <Button type="submit" isPending={isPending} pendingLabel={m.common.saving}>
              {m.common.save}
            </Button>
            {onDelete && (
              <Button variant="danger" disabled={isPending} isPending={isDeleting} onClick={() => void remove()}>
                {m.common.delete}
              </Button>
            )}
            {onDuplicate && (
              <Button variant="outline" disabled={isPending || isDeleting} onClick={() => onDuplicate(values)}>
                {m.events.duplicate}
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>
              {m.common.cancel}
            </Button>
          </div>
        </Form>
      </Modal>

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
