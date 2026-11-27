import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFeatures } from '../../../context/HostContext.ts'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import type { CalendarEvent } from '../../../domain/event.ts'
import {
  type ExternalCalendar,
  type ExternalCalendarChanges,
  type ExternalCalendarInput,
} from '../utils/externalCalendar.ts'
import { useAuth } from '../../authorization/index.ts'
import { useStorage } from '../../storage/index.ts'
import {
  ExternalCalendarsContext,
  NO_EXTERNAL_CALENDARS,
  type ExternalCalendarsContextValue,
} from './ExternalCalendarsContext.ts'
import { removeById, replaceById } from '../../../utils/list.ts'

type Converter = typeof import('../utils/externalEvents.ts').toExternalEvents

const REFRESH_MS = 15 * 60_000
const NO_CALENDARS: ExternalCalendar[] = []

type Content = { text: string | null; failed: boolean }

export function ExternalCalendarsProvider({ children }: { children: ReactNode }) {
  const { externalCalendars: isEnabled } = useFeatures()
  const { user } = useAuth()
  const { externalCalendars: repository } = useStorage()
  const isAvailable = Boolean(isEnabled && user && repository)

  if (!isAvailable || !repository)
    return <ExternalCalendarsContext value={NO_EXTERNAL_CALENDARS}>{children}</ExternalCalendarsContext>
  return <ActiveProvider repository={repository}>{children}</ActiveProvider>
}

type ActiveProviderProps = {
  repository: NonNullable<ReturnType<typeof useStorage>['externalCalendars']>
  children: ReactNode
}

function ActiveProvider({ repository, children }: ActiveProviderProps) {
  const load = useCallback(() => repository.list(), [repository])
  const { data: calendars, error, isLoading, update: updateList } = useAsyncResource(load, NO_CALENDARS)
  const [contents, setContents] = useState<ReadonlyMap<string, Content>>(new Map())
  const requested = useRef(new Set<string>())

  const fetchContent = useCallback(
    (id: string) => {
      requested.current.add(id)
      repository
        .content(id)
        .then((text) => setContents((current) => new Map(current).set(id, { text, failed: false })))
        .catch(() =>
          setContents((current) => new Map(current).set(id, { text: current.get(id)?.text ?? null, failed: true })),
        )
    },
    [repository],
  )

  useEffect(() => {
    for (const calendar of calendars)
      if (calendar.shown && !requested.current.has(calendar.id)) fetchContent(calendar.id)
  }, [calendars, fetchContent])

  useEffect(() => {
    const timer = setInterval(() => {
      for (const id of requested.current) fetchContent(id)
    }, REFRESH_MS)
    return () => clearInterval(timer)
  }, [fetchContent])

  const [convert, setConvert] = useState<Converter | null>(null)
  const needsConverter = calendars.some((calendar) => calendar.shown)

  useEffect(() => {
    if (!needsConverter || convert) return
    let cancelled = false
    void import('../utils/externalEvents.ts').then(({ toExternalEvents }) => {
      if (!cancelled) setConvert(() => toExternalEvents)
    })
    return () => {
      cancelled = true
    }
  }, [needsConverter, convert])

  const events = useMemo<CalendarEvent[]>(
    () =>
      convert
        ? calendars
            .filter((calendar) => calendar.shown)
            .flatMap((calendar) => {
              const text = contents.get(calendar.id)?.text
              return text ? convert(calendar, text) : []
            })
        : [],
    [calendars, contents, convert],
  )

  const failedIds = useMemo(
    () => new Set([...contents].filter(([, content]) => content.failed).map(([id]) => id)),
    [contents],
  )

  const value = useMemo<ExternalCalendarsContextValue>(
    () => ({
      isAvailable: true,
      calendars,
      events,
      failedIds,
      isLoading,
      error,
      create: async (input: ExternalCalendarInput) => {
        const created = await repository.create(input)
        updateList((current) => [...current, created])
        fetchContent(created.id)
      },
      update: async (id: string, changes: ExternalCalendarChanges) => {
        const updated = await repository.update(id, changes)
        updateList((current) => replaceById(current, updated))
        if (changes.url !== undefined || (changes.shown && !requested.current.has(id))) fetchContent(id)
      },
      remove: async (id: string) => {
        await repository.remove(id)
        requested.current.delete(id)
        updateList((current) => removeById(current, id))
        setContents((current) => {
          const next = new Map(current)
          next.delete(id)
          return next
        })
      },
      refresh: fetchContent,
    }),
    [calendars, events, failedIds, isLoading, error, repository, updateList, fetchContent],
  )

  return <ExternalCalendarsContext value={value}>{children}</ExternalCalendarsContext>
}
