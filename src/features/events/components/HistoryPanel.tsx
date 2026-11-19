import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../../components/Button.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { useViewerTimeZone } from '../../../context/TimeZoneContext.ts'
import { getErrorMessage, useI18n, type I18n } from '../../../i18n/index.ts'
import { isISODate, isTime, timeToMinutes } from '../../../utils/date.ts'
import { getEventColorLabel, isEventColor } from '../../../utils/event.ts'
import type { HistoryChange, HistoryEntry } from '../../../utils/history.ts'
import { formatTimestamp } from '../../../utils/timestamp.ts'
import { useStorage } from '../../storage/index.ts'

const PREVIEW_LENGTH = 80

type HistoryPanelProps = {
  eventId: string
  calendarNames: ReadonlyMap<string, string>
  isActive: boolean
}

const shorten = (value: string) => (value.length > PREVIEW_LENGTH ? `${value.slice(0, PREVIEW_LENGTH - 1)}…` : value)

const formatMoment = (value: string, { format }: Pick<I18n, 'format'>) => {
  const [date, time] = value.split('T')
  if (!isISODate(date)) return value
  return time && isTime(time) ? `${format.fullDay(date)} ${format.time(timeToMinutes(time))}` : format.fullDay(date)
}

const formatValue = (
  change: HistoryChange,
  value: string | null,
  i18n: Pick<I18n, 'm' | 'format'>,
  calendarNames: ReadonlyMap<string, string>,
) => {
  const text = i18n.m.events.history
  if (value === null || value === '') return text.empty
  switch (change.field) {
    case 'start':
    case 'end':
      return formatMoment(value, i18n)
    case 'allDay':
      return value === 'true' || value === '1' ? text.yes : text.no
    case 'color':
      return isEventColor(value) ? getEventColorLabel(value, i18n.m) : value
    case 'calendar':
      return calendarNames.get(value) ?? text.otherCalendar
    default:
      return shorten(value)
  }
}

function HistoryItem({ entry, calendarNames }: { entry: HistoryEntry; calendarNames: ReadonlyMap<string, string> }) {
  const i18n = useI18n()
  const { m, locale } = i18n
  const text = m.events.history
  const timeZone = useViewerTimeZone()
  const author = entry.changedBy?.name || text.someone

  return (
    <li className="historyEntry">
      <p className="historyHeading">
        <span className="historyAuthor">{text.actions[entry.action](author)}</span>
        <time dateTime={entry.changedAt}>{formatTimestamp(entry.changedAt, locale, timeZone)}</time>
      </p>
      {entry.changes.length > 0 && (
        <ul className="historyChanges">
          {entry.changes.map((change) => (
            <li key={change.field}>
              <span className="historyField">{text.fields[change.field]}</span>
              {change.old === null && change.new === null ? (
                <span className="historyValue">{text.changed}</span>
              ) : (
                <span className="historyValue">
                  <del>{formatValue(change, change.old, i18n, calendarNames)}</del>
                  {' → '}
                  <ins>{formatValue(change, change.new, i18n, calendarNames)}</ins>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

export function HistoryPanel({ eventId, calendarNames, isActive }: HistoryPanelProps) {
  const { m } = useI18n()
  const text = m.events.history
  const { history } = useStorage()
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const load = useCallback(
    async (before?: string) => {
      if (!history) return
      try {
        const page = await history.list(eventId, { before })
        setEntries((current) => (before && current ? [...current, ...page.entries] : page.entries))
        setHasMore(page.hasMore)
        setError(null)
      } catch (caught) {
        setError(getErrorMessage(caught, m))
      }
    },
    [history, eventId, m],
  )

  useEffect(() => {
    if (!isActive || !history) return
    let cancelled = false
    history
      .list(eventId)
      .then((page) => {
        if (cancelled) return
        setEntries(page.entries)
        setHasMore(page.hasMore)
        setError(null)
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(getErrorMessage(caught, m))
      })
    return () => {
      cancelled = true
    }
  }, [isActive, history, eventId, m])

  const loadMore = async () => {
    const last = entries?.at(-1)
    if (!last) return
    setIsLoadingMore(true)
    await load(last.id)
    setIsLoadingMore(false)
  }

  return (
    <div className="historyPanel">
      <ErrorMessage message={error} />
      {entries === null ? (
        !error && <p className="formHint">{m.common.loading}</p>
      ) : entries.length === 0 ? (
        <p className="emptyHint">{text.none}</p>
      ) : (
        <ol className="historyList">
          {entries.map((entry) => (
            <HistoryItem key={entry.id} entry={entry} calendarNames={calendarNames} />
          ))}
        </ol>
      )}
      {hasMore && (
        <div className="buttonRow">
          <Button variant="outline" isPending={isLoadingMore} onClick={() => void loadMore()}>
            {text.loadMore}
          </Button>
        </div>
      )}
    </div>
  )
}
