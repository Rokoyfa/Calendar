import { useCallback, useMemo, useState } from 'react'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { Modal } from '../../../components/Modal.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import type { CalendarEvent } from '../../../utils/event.ts'
import { useStorage } from '../hooks/useStorage.ts'
import { LocalEventRepository } from '../repositories/LocalEventRepository.ts'
import { copyEvents } from '../utils/copyEvents.ts'
import { LocalStorageList } from '../utils/localStorageList.ts'

const declinedUsers = new LocalStorageList<string>(
  'calendar.localImportDeclined.v1',
  (value) => (typeof value === 'string' ? value : null),
  'Die Entscheidung konnte nicht gespeichert werden.',
)

const NO_EVENTS: CalendarEvent[] = []

type LocalImportPromptProps = {
  userId: string
}

export function LocalImportPrompt({ userId }: LocalImportPromptProps) {
  const { mode, events: target, invalidate } = useStorage()
  const localEvents = useMemo(() => new LocalEventRepository(), [])
  const load = useCallback(() => localEvents.listAll(), [localEvents])
  const { data: pending, isLoading } = useAsyncResource(load, NO_EVENTS)
  const [isDismissed, setIsDismissed] = useState(() => declinedUsers.read().includes(userId))

  const { run: importEvents, isPending, error } = useAsyncAction(async () => {
    await copyEvents(pending, target)
    await localEvents.clear()
    invalidate()
    setIsDismissed(true)
  })

  const keepLocal = () => {
    declinedUsers.update((users) => [...new Set([...users, userId])])
    setIsDismissed(true)
  }

  if (mode !== 'remote' || isLoading || isDismissed || pending.length === 0) return null

  const count = pending.length === 1 ? 'einen Termin' : `${pending.length} Termine`

  return (
    <Modal title="Lokale Termine übernehmen?" onClose={keepLocal}>
      <p className="modalMessage">
        In diesem Browser sind {count} ohne Konto gespeichert. Sollen sie in dein Konto übernommen werden? Danach
        sind sie auf allen Geräten verfügbar und werden hier lokal entfernt.
      </p>
      <ErrorMessage message={error} />
      <div className="modalActions modalActions--stacked">
        <button
          type="button"
          className="button button--block"
          disabled={isPending}
          onClick={() => void importEvents()}
          data-autofocus
        >
          {isPending ? 'Wird übernommen …' : 'In mein Konto übernehmen'}
        </button>
        <button type="button" className="button button--secondary button--block" disabled={isPending} onClick={keepLocal}>
          Nur in diesem Browser behalten
        </button>
      </div>
    </Modal>
  )
}
