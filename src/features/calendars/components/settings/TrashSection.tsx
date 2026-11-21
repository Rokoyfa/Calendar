import { useCallback, useState } from 'react'
import { Button } from '../../../../components/Button.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { ErrorMessage } from '../../../../components/StatusMessage.tsx'
import { useAsyncResource } from '../../../../hooks/useAsyncResource.ts'
import { useI18n } from '../../../../i18n/index.ts'
import { ConfirmModal } from '../../../../components/ConfirmModal.tsx'
import { TextField } from '../../../../components/TextField.tsx'
import { timeToMinutes, toISODate } from '../../../../utils/date.ts'
import type { TrashedEvent } from '../../../../utils/trash.ts'
import { useAuth } from '../../../authorization/index.ts'
import { useStorage } from '../../../storage/index.ts'
import type { EventRepository } from '../../../storage/types/storage.ts'
import type { CalendarSummary } from '../../types/calendar.ts'
import { canDeleteEntry } from '../../utils/permissions.ts'
import { useConfirm } from '../../../../hooks/useConfirm.ts'
import { useActionError } from '../../../../hooks/useActionError.ts'

type TrashRepository = EventRepository & Required<Pick<EventRepository, 'listTrash' | 'restore' | 'purge'>>

const NO_ENTRIES: TrashedEvent[] = []
const PAGE_SIZE = 20
const EMPTY_ID = '*'
const SEARCH_FROM = 8

const matches = (entry: TrashedEvent, query: string, locale: string) => {
  const needle = query.trim().toLocaleLowerCase(locale)
  if (!needle) return true
  const { title, location } = entry.event
  return [title, location, entry.deletedByName ?? ''].some((value) => value.toLocaleLowerCase(locale).includes(needle))
}

const hasTrash = (repository: EventRepository): repository is TrashRepository =>
  Boolean(repository.listTrash && repository.restore && repository.purge)

export function TrashSection({ calendar }: { calendar: CalendarSummary }) {
  const { events } = useStorage()
  return hasTrash(events) ? <TrashList calendar={calendar} repository={events} /> : null
}

function TrashList({ calendar, repository }: { calendar: CalendarSummary; repository: TrashRepository }) {
  const { m, format, locale } = useI18n()
  const text = m.calendars.trash
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const { user } = useAuth()
  const { version, invalidate } = useStorage()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const { error: actionError, attempt } = useActionError()
  const deletion = useConfirm<TrashedEvent>()
  const toDelete = deletion.target
  const [confirmEmpty, setConfirmEmpty] = useState(false)
  const load = useCallback(() => repository.listTrash(calendar.id), [repository, calendar.id])
  const { data: entries, error, isLoading } = useAsyncResource(load, NO_ENTRIES, version)

  const run = async (id: string, action: () => Promise<unknown>) => {
    setPendingId(id)
    if (await attempt(action)) invalidate()
    setPendingId(null)
  }

  const deletable = entries.filter((entry) => canDeleteEntry(calendar, entry.event.createdBy, user?.id ?? null))
  const emptyTrash = repository.emptyTrash
  const found = entries.filter((entry) => matches(entry, query, locale))
  const shown = found.slice(0, limit)

  const describe = ({ event }: TrashedEvent) =>
    event.allDay
      ? format.longDate(event.startDate)
      : `${format.longDate(event.startDate)}, ${format.time(timeToMinutes(event.start))}`
  const dayOf = (timestamp: string) => format.fullDay(toISODate(new Date(timestamp)))

  return (
    <PageSection title={text.title} description={text.description}>
      <ErrorMessage message={error ?? actionError} />
      {emptyTrash && deletable.length > 0 && (
        <div className="buttonRow trashActions">
          <Button variant="dangerOutline" disabled={pendingId !== null} onClick={() => setConfirmEmpty(true)}>
            {text.emptyAction}
          </Button>
        </div>
      )}
      {entries.length >= SEARCH_FROM && (
        <TextField
          label={text.search}
          name="trashSearch"
          type="search"
          autoComplete="off"
          placeholder={text.searchPlaceholder}
          value={query}
          onChange={(value) => {
            setQuery(value)
            setLimit(PAGE_SIZE)
          }}
        />
      )}
      {!isLoading && entries.length === 0 ? (
        <p className="emptyHint">{text.empty}</p>
      ) : found.length === 0 ? (
        <p className="emptyHint">{text.noResults}</p>
      ) : (
        <ul className="itemList">
          {shown.map((entry) => {
            const { event } = entry
            const mayChange = canDeleteEntry(calendar, event.createdBy, user?.id ?? null)
            const isPending = pendingId === event.id
            return (
              <li key={event.id} className="itemRow trashRow">
                <span className="itemRowMain">
                  <span className="itemRowTitle">{event.title}</span>
                  <span className="itemRowMeta">
                    {describe(entry)}
                    {entry.detachedCount > 0 && ` · ${text.withDetached(entry.detachedCount)}`}
                  </span>
                  <span className="itemRowMeta">
                    {entry.deletedByName
                      ? text.deletedBy(entry.deletedByName, dayOf(entry.deletedAt))
                      : text.deletedAt(dayOf(entry.deletedAt))}{' '}
                    · {text.expires(dayOf(entry.expiresAt))}
                  </span>
                </span>
                {mayChange && (
                  <span className="buttonRow">
                    <Button
                      variant="outline"
                      className="trashRestore"
                      isPending={isPending}
                      disabled={pendingId !== null && !isPending}
                      onClick={() => void run(event.id, () => repository.restore(event.id))}
                    >
                      {text.restore}
                    </Button>
                    <Button
                      variant="dangerOutline"
                      disabled={pendingId !== null}
                      aria-label={text.deleteForeverLabel(event.title)}
                      onClick={() => deletion.ask(entry)}
                    >
                      {text.deleteForever}
                    </Button>
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {found.length > shown.length && (
        <div className="buttonRow">
          <Button variant="secondary" onClick={() => setLimit((current) => current + PAGE_SIZE)}>
            {text.showMore(shown.length, found.length)}
          </Button>
        </div>
      )}
      {toDelete && (
        <ConfirmModal
          title={text.confirmTitle}
          confirmLabel={text.deleteForever}
          pendingLabel={m.common.deleting}
          onConfirm={() => run(toDelete.event.id, () => repository.purge(calendar.id, toDelete.event.id))}
          onClose={deletion.close}
        >
          {text.confirmDelete(toDelete.event.title)}
        </ConfirmModal>
      )}
      {confirmEmpty && emptyTrash && (
        <ConfirmModal
          title={text.emptyTitle}
          confirmLabel={text.emptyAction}
          pendingLabel={m.common.deleting}
          onConfirm={() => run(EMPTY_ID, () => emptyTrash(calendar.id))}
          onClose={() => setConfirmEmpty(false)}
        >
          {deletable.length === entries.length
            ? text.emptyConfirm(deletable.length)
            : text.emptyConfirmOwn(deletable.length, entries.length)}
        </ConfirmModal>
      )}
    </PageSection>
  )
}
