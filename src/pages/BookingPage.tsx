import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { Button } from '../components/Button.tsx'
import { Form } from '../components/Form.tsx'
import { FormActions } from '../components/FormActions.tsx'
import { FormField } from '../components/FormField.tsx'
import { IconButton } from '../components/IconButton.tsx'
import { ChevronLeftIcon, ChevronRightIcon } from '../components/Icons.tsx'
import { PageLayout } from '../components/PageLayout.tsx'
import { ActionFeedback, ErrorMessage } from '../components/StatusMessage.tsx'
import { TextField } from '../components/TextField.tsx'
import { useHost } from '../context/HostContext.ts'
import { useViewerTimeZone } from '../context/TimeZoneContext.ts'
import { useStorage, type BookingRepository } from '../features/storage/index.ts'
import { useAsyncResource } from '../hooks/useAsyncResource.ts'
import { useForm } from '../hooks/useForm.ts'
import { useLocationUrl } from '../hooks/useLocationUrl.ts'
import { useI18n } from '../i18n/index.ts'
import { isApiError } from '../utils/apiError.ts'
import {
  BOOKING_HOLD_MINUTES,
  BOOKING_NAME_MAX_LENGTH,
  BOOKING_NOTE_MAX_LENGTH,
  groupBookingSlots,
  toBookingSlots,
  type BookingSlot,
  type PublicBookingPage,
} from '../utils/booking.ts'
import { addDaysToISODate, DAYS_PER_WEEK, fromISODate, startOfWeekISO, timeToMinutes } from '../utils/date.ts'
import { getEventColorAttributes } from '../utils/event.ts'
import { formatTimeZoneLabel, fromInstant } from '../utils/timeZone.ts'
import { EMAIL_MAX_LENGTH, normalizeEmail, validateEmail } from '../utils/validation.ts'

const MAX_WEEKS_AHEAD = 53
const NO_SLOTS: string[] = []

type BookerValues = { name: string; email: string; note: string }

const EMPTY_BOOKER: BookerValues = { name: '', email: '', note: '' }

type Sent = { email: string; slot: BookingSlot }

function BookingHeader({ page }: { page: PublicBookingPage }) {
  const i18n = useI18n()
  const text = i18n.m.bookings.public
  const getLocationUrl = useLocationUrl()
  return (
    <div className="respondEvent">
      <p {...getEventColorAttributes(page.color, 'activeCalendar bookingHost')}>
        <span className="activeCalendarDot" aria-hidden="true" />
        <span className="activeCalendarName">{page.hostName ? text.with(page.hostName) : page.title}</span>
      </p>
      <p>{i18n.format.duration(page.durationMinutes)}</p>
      {page.location && (
        <p>
          <a href={getLocationUrl(page.location) ?? undefined} target="_blank" rel="noopener noreferrer">
            {page.location}
          </a>
        </p>
      )}
      {page.description && <p className="bookingDescription">{page.description}</p>}
    </div>
  )
}

function SlotPicker({
  token,
  repository,
  refreshKey,
  onSelect,
}: {
  token: string
  repository: BookingRepository
  refreshKey: number
  onSelect: (slot: BookingSlot) => void
}) {
  const i18n = useI18n()
  const { format } = i18n
  const text = i18n.m.bookings.public
  const viewerTimeZone = useViewerTimeZone()
  const [openedAt] = useState(() => Date.now())
  const firstWeek = startOfWeekISO(fromInstant(openedAt, viewerTimeZone).date, format.firstDay)
  const [weekStart, setWeekStart] = useState(firstWeek)
  const lastWeek = addDaysToISODate(firstWeek, (MAX_WEEKS_AHEAD - 1) * DAYS_PER_WEEK)
  const weekEnd = addDaysToISODate(weekStart, DAYS_PER_WEEK - 1)
  const load = useCallback(
    () => repository.listSlots(token, { from: addDaysToISODate(weekStart, -1), to: addDaysToISODate(weekEnd, 1) }),
    [repository, token, weekStart, weekEnd],
  )
  const { data, error, isLoading } = useAsyncResource(load, NO_SLOTS, refreshKey)
  const days = useMemo(
    () =>
      groupBookingSlots(
        toBookingSlots(data, viewerTimeZone).filter((slot) => slot.date >= weekStart && slot.date <= weekEnd),
      ),
    [data, viewerTimeZone, weekStart, weekEnd],
  )

  return (
    <section className="bookingSlots" aria-busy={isLoading}>
      <div className="bookingWeek">
        <IconButton
          label={text.previousWeek}
          disabled={weekStart <= firstWeek}
          onClick={() => setWeekStart(addDaysToISODate(weekStart, -DAYS_PER_WEEK))}
        >
          <ChevronLeftIcon size={18} />
        </IconButton>
        <h2 className="bookingWeekTitle">{format.weekTitle(fromISODate(weekStart))}</h2>
        <IconButton
          label={text.nextWeek}
          disabled={weekStart >= lastWeek}
          onClick={() => setWeekStart(addDaysToISODate(weekStart, DAYS_PER_WEEK))}
        >
          <ChevronRightIcon size={18} />
        </IconButton>
      </div>
      <p className="formHint">{text.timeZoneHint(formatTimeZoneLabel(viewerTimeZone))}</p>
      <ErrorMessage message={error} />
      {isLoading ? (
        <p className="emptyHint">{i18n.m.common.loading}</p>
      ) : days.size === 0 ? (
        !error && <p className="emptyHint">{text.noSlots}</p>
      ) : (
        <ul className="bookingDays">
          {[...days].map(([date, slots]) => (
            <li key={date} className="bookingDay">
              <h3 className="bookingDayTitle">{format.longDate(date)}</h3>
              <div className="bookingTimes">
                {slots.map((slot) => (
                  <Button key={slot.start} variant="outline" onClick={() => onSelect(slot)}>
                    {format.time(timeToMinutes(slot.time))}
                  </Button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function BookerForm({
  slot,
  onBook,
  onChangeTime,
}: {
  slot: BookingSlot
  onBook: (values: BookerValues) => Promise<void>
  onChangeTime: () => void
}) {
  const i18n = useI18n()
  const { m, format } = i18n
  const text = m.bookings.public
  const form = useForm<BookerValues>({
    initialValues: EMPTY_BOOKER,
    prepare: ({ name, email, note }) => ({ name: name.trim(), email: normalizeEmail(email), note: note.trim() }),
    validate: ({ name, email }) => ({
      name: name ? undefined : text.nameRequired,
      email: validateEmail(email, m),
    }),
    onSubmit: onBook,
  })

  return (
    <Form onSubmit={form.handleSubmit}>
      <p className="bookingSelected">
        {text.selected(format.longDate(slot.date), format.time(timeToMinutes(slot.time)))}
      </p>
      <div className="buttonRow">
        <Button variant="outline" onClick={onChangeTime}>
          {text.changeTime}
        </Button>
      </div>
      <TextField
        label={text.name}
        name="name"
        autoComplete="name"
        maxLength={BOOKING_NAME_MAX_LENGTH}
        data-autofocus
        {...form.bind('name')}
      />
      <TextField
        label={text.email}
        name="email"
        type="email"
        autoComplete="email"
        maxLength={EMAIL_MAX_LENGTH}
        {...form.bind('email')}
      />
      <FormField label={text.note}>
        <textarea
          className="textarea"
          name="note"
          maxLength={BOOKING_NOTE_MAX_LENGTH}
          value={form.values.note}
          onChange={(event) => form.setField('note', event.target.value)}
        />
      </FormField>
      <p className="formHint">{text.confirmHint(BOOKING_HOLD_MINUTES)}</p>
      <ActionFeedback error={form.error} />
      <FormActions isPending={form.isPending} submitLabel={text.submit} pendingLabel={text.submitting} />
    </Form>
  )
}

function BookingView({
  page,
  token,
  repository,
}: {
  page: PublicBookingPage
  token: string
  repository: BookingRepository
}) {
  const i18n = useI18n()
  const text = i18n.m.bookings.public
  const [selected, setSelected] = useState<BookingSlot | null>(null)
  const [sent, setSent] = useState<Sent | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)

  const select = (slot: BookingSlot) => {
    setNotice(null)
    setSelected(slot)
  }

  const book = async (values: BookerValues) => {
    if (!selected) return
    try {
      await repository.book(token, { start: selected.start, ...values })
      setSent({ email: values.email, slot: selected })
    } catch (error) {
      if (!isApiError(error) || error.code !== 'slotUnavailable') throw error
      setNotice(i18n.m.errors.slotUnavailable)
      setSelected(null)
      setRefreshKey((current) => current + 1)
    }
  }

  return (
    <PageLayout title={page.title} back={false}>
      <BookingHeader page={page} />
      {sent ? (
        <div className="bookingSent" role="status">
          <h2 className="respondTitle">{text.sentTitle}</h2>
          <p>{text.sent(sent.email, BOOKING_HOLD_MINUTES)}</p>
          <p className="formHint">
            {text.selected(i18n.format.longDate(sent.slot.date), i18n.format.time(timeToMinutes(sent.slot.time)))}
          </p>
          <div className="buttonRow">
            <Button
              variant="outline"
              onClick={() => {
                setSent(null)
                setSelected(null)
                setRefreshKey((current) => current + 1)
              }}
            >
              {text.again}
            </Button>
          </div>
        </div>
      ) : selected ? (
        <BookerForm slot={selected} onBook={book} onChangeTime={() => setSelected(null)} />
      ) : (
        <>
          <ErrorMessage message={notice} />
          <SlotPicker token={token} repository={repository} refreshKey={refreshKey} onSelect={select} />
        </>
      )}
    </PageLayout>
  )
}

export function BookingPage() {
  const { token = '' } = useParams()
  const { bookings } = useStorage()
  const { m } = useI18n()
  const { bookingPages } = useHost().features
  const repository = bookingPages ? (bookings ?? null) : null
  const load = useCallback(async () => (repository ? repository.getPublic(token) : null), [repository, token])
  const { data: page, error, isLoading } = useAsyncResource<PublicBookingPage | null>(load, null)

  if (isLoading) return <p className="appLoading">{m.common.loading}</p>
  if (!repository || !page)
    return (
      <PageLayout title={m.bookings.public.title} back={false}>
        <ErrorMessage message={error && repository ? error : m.errors.bookingPageNotFound} />
      </PageLayout>
    )
  return <BookingView page={page} token={token} repository={repository} />
}
