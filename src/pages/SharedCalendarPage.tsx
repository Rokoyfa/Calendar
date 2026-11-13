import { useCallback, useMemo } from 'react'
import { useParams } from 'react-router'
import { useHost } from '../context/HostContext.ts'
import { useRootElement } from '../context/RootElementContext.ts'
import { Calendar } from '../features/calendar/index.ts'
import { usePreferences } from '../features/preferences/index.ts'
import {
  StorageProvider,
  useStorage,
  type CategoryRepository,
  type EventRepository,
  type SharedCalendarRepository,
} from '../features/storage/index.ts'
import { useAsyncResource } from '../hooks/useAsyncResource.ts'
import { useI18n } from '../i18n/index.ts'
import { AppError } from '../utils/appError.ts'
import { nearestView } from '../utils/calendarView.ts'
import { getEventColorAttributes } from '../utils/event.ts'
import { getStartView, isCompactWidth } from '../utils/preferences.ts'
import type { SharedCalendar } from '../utils/sharedCalendar.ts'

const readOnly = () => Promise.reject(new AppError('forbidden'))

const createEventRepository = (shared: SharedCalendarRepository, token: string): EventRepository => ({
  list: ({ from, to }) => shared.listEvents(token, { from, to }),
  listSeries: async () => [],
  create: readOnly,
  update: readOnly,
  remove: readOnly,
})

const createCategoryRepository = (calendar: SharedCalendar): CategoryRepository => ({
  list: async () => calendar.categories,
  create: readOnly,
  rename: readOnly,
  remove: readOnly,
})

function SharedCalendarView({
  calendar,
  token,
  shared,
}: {
  calendar: SharedCalendar
  token: string
  shared: SharedCalendarRepository
}) {
  const root = useRootElement()
  const host = useHost()
  const storage = useStorage()
  const { m } = useI18n()
  const { preferences } = usePreferences()
  const repositories = useMemo(
    () => ({
      mode: storage.mode,
      colors: storage.colors,
      preferences: storage.preferences,
      holidays: storage.holidays,
      events: createEventRepository(shared, token),
      categories: createCategoryRepository(calendar),
    }),
    [storage.mode, storage.colors, storage.preferences, storage.holidays, shared, token, calendar],
  )
  const calendarIds = useMemo(() => [calendar.id], [calendar.id])
  const initialView =
    host.initialView ?? nearestView(getStartView(preferences, isCompactWidth(root.clientWidth)), host.views)

  return (
    <StorageProvider repositories={repositories}>
      <div className="app">
        <Calendar
          calendarIds={calendarIds}
          targetCalendarId={calendar.id}
          canCreate={false}
          readOnly
          initialView={initialView}
          headerContext={
            <p {...getEventColorAttributes(calendar.color, 'activeCalendar')}>
              <span className="activeCalendarDot" aria-hidden="true" />
              <span className="activeCalendarName">{calendar.name}</span>
              <span className="activeCalendarMeta">{m.calendars.share.readOnly}</span>
            </p>
          }
        />
      </div>
    </StorageProvider>
  )
}

export function SharedCalendarPage() {
  const { token = '' } = useParams()
  const { shared } = useStorage()
  const { m } = useI18n()
  const { publicLinks } = useHost().features
  const source = publicLinks ? (shared ?? null) : null
  const load = useCallback(async () => (source ? source.get(token) : null), [source, token])
  const { data: calendar, error, isLoading } = useAsyncResource<SharedCalendar | null>(load, null)

  if (isLoading) return <p className="appLoading">{m.common.loading}</p>
  if (!source || !calendar)
    return (
      <p className="appLoading" role="alert">
        {error && source ? error : m.calendars.share.notFound}
      </p>
    )
  return <SharedCalendarView calendar={calendar} token={token} shared={source} />
}
