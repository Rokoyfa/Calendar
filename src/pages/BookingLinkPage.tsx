import { useCallback, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { Button } from '../components/Button.tsx'
import { PageLayout } from '../components/PageLayout.tsx'
import { ActionFeedback, ErrorMessage } from '../components/StatusMessage.tsx'
import { TOKEN_PARAM } from '../config/routes.ts'
import { useHost } from '../context/HostContext.ts'
import { useViewerTimeZone } from '../context/TimeZoneContext.ts'
import { useStorage, type BookingRepository } from '../features/storage/index.ts'
import { useAsyncAction } from '../hooks/useAsyncAction.ts'
import { useAsyncResource } from '../hooks/useAsyncResource.ts'
import { useLocationUrl } from '../hooks/useLocationUrl.ts'
import { useI18n } from '../i18n/index.ts'
import { isBookingCancelable, type BookingSummary } from '../features/bookings/index.ts'
import { formatEventPeriod } from '../domain/event.ts'
import { fromInstant } from '../utils/timeZone.ts'

function BookingDetails({ summary }: { summary: BookingSummary }) {
  const i18n = useI18n()
  const text = i18n.m.bookings.public
  const viewerTimeZone = useViewerTimeZone()
  const getLocationUrl = useLocationUrl()
  const start = fromInstant(Date.parse(summary.start), viewerTimeZone)
  const end = fromInstant(Date.parse(summary.end), viewerTimeZone)
  const period = { startDate: start.date, start: start.time, endDate: end.date, end: end.time }

  return (
    <div className="respondEvent">
      <h2 className="respondTitle">{summary.title}</h2>
      {summary.hostName && <p>{text.with(summary.hostName)}</p>}
      <p>
        {period.startDate === period.endDate
          ? `${i18n.format.longDate(period.startDate)}, ${formatEventPeriod(period, i18n)}`
          : formatEventPeriod(period, i18n)}
      </p>
      {summary.location && (
        <p>
          <a href={getLocationUrl(summary.location) ?? undefined} target="_blank" rel="noopener noreferrer">
            {summary.location}
          </a>
        </p>
      )}
    </div>
  )
}

function useBookingLink() {
  const [searchParams] = useSearchParams()
  const { bookings } = useStorage()
  const { bookingPages } = useHost().features
  return { token: searchParams.get(TOKEN_PARAM), repository: bookingPages ? (bookings ?? null) : null }
}

function BookingLinkLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <PageLayout title={title} back={false}>
      {children}
    </PageLayout>
  )
}

function ConfirmBooking({ token, repository }: { token: string; repository: BookingRepository }) {
  const { m } = useI18n()
  const text = m.bookings.confirm
  const [summary, setSummary] = useState<BookingSummary | null>(null)
  const confirm = useAsyncAction(async () => setSummary(await repository.confirm(token)))

  if (summary)
    return (
      <>
        <BookingDetails summary={summary} />
        <ActionFeedback
          error={summary.status === 'canceled' ? text.canceled : null}
          success={summary.status === 'confirmed' && text.confirmed}
        />
      </>
    )

  return (
    <>
      <p>{text.intro}</p>
      <ActionFeedback error={confirm.error} />
      <Button block isPending={confirm.isPending} pendingLabel={text.confirming} onClick={() => void confirm.run()}>
        {text.button}
      </Button>
    </>
  )
}

function CancelBooking({ token, repository }: { token: string; repository: BookingRepository }) {
  const { m } = useI18n()
  const text = m.bookings.cancel
  const load = useCallback(() => repository.lookup(token), [repository, token])
  const { data: found, error, isLoading } = useAsyncResource<BookingSummary | null>(load, null)
  const [changed, setChanged] = useState<BookingSummary | null>(null)
  const cancel = useAsyncAction(async () => setChanged(await repository.cancel(token)))
  const summary = changed ?? found

  if (isLoading) return <p className="formHint">{m.common.loading}</p>
  if (!summary) return <ErrorMessage message={error} />

  return (
    <>
      <BookingDetails summary={summary} />
      {summary.status === 'canceled' ? (
        <ActionFeedback error={null} success={changed ? text.done : text.alreadyCanceled} />
      ) : isBookingCancelable(summary) ? (
        <>
          <p>{text.question}</p>
          <ActionFeedback error={cancel.error} />
          <Button
            variant="danger"
            block
            isPending={cancel.isPending}
            pendingLabel={text.canceling}
            onClick={() => void cancel.run()}
          >
            {text.button}
          </Button>
        </>
      ) : (
        <p className="formHint">{summary.status === 'pending' ? text.notConfirmed : text.started}</p>
      )}
    </>
  )
}

export function BookingConfirmPage() {
  const { m } = useI18n()
  const { token, repository } = useBookingLink()
  return (
    <BookingLinkLayout title={m.bookings.confirm.title}>
      {!repository ? (
        <ErrorMessage message={m.errors.bookingNotFound} />
      ) : token ? (
        <ConfirmBooking token={token} repository={repository} />
      ) : (
        <ErrorMessage message={m.bookings.incompleteLink} />
      )}
    </BookingLinkLayout>
  )
}

export function BookingCancelPage() {
  const { m } = useI18n()
  const { token, repository } = useBookingLink()
  return (
    <BookingLinkLayout title={m.bookings.cancel.title}>
      {!repository ? (
        <ErrorMessage message={m.errors.bookingNotFound} />
      ) : token ? (
        <CancelBooking token={token} repository={repository} />
      ) : (
        <ErrorMessage message={m.bookings.incompleteLink} />
      )}
    </BookingLinkLayout>
  )
}
