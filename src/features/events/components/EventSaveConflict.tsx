import { Button } from '../../../components/Button.tsx'
import { useI18n } from '../../../i18n/index.ts'

type EventSaveConflictProps = {
  remoteChange: 'updated' | 'deleted' | null
  hasConflict: boolean
  isPending: boolean
  onOverwrite: () => void
  onReload?: () => void
}

export function EventSaveConflict({
  remoteChange,
  hasConflict,
  isPending,
  onOverwrite,
  onReload,
}: EventSaveConflictProps) {
  const { m } = useI18n()
  if (hasConflict)
    return (
      <div className="eventConflict" role="alert">
        <p>{m.events.conflict.message}</p>
        <div className="buttonRow">
          <Button variant="outline" isPending={isPending} onClick={onOverwrite}>
            {m.events.conflict.overwrite}
          </Button>
          {onReload && (
            <Button variant="secondary" onClick={onReload}>
              {m.events.conflict.reload}
            </Button>
          )}
        </div>
      </div>
    )
  if (!remoteChange) return null
  return (
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
  )
}
