import { AsyncSwitch } from '../../../components/AsyncSwitch.tsx'
import { Button } from '../../../components/Button.tsx'
import { ConfirmModal } from '../../../components/ConfirmModal.tsx'
import { ItemList } from '../../../components/ItemList.tsx'
import { PageSection } from '../../../components/PageSection.tsx'
import { ActionFeedback, ErrorMessage } from '../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useConfirm } from '../../../hooks/useConfirm.ts'
import { useI18n } from '../../../i18n/index.ts'
import { getEventColorAttributes, type EventColor } from '../../../utils/event.ts'
import type { PeerCalendar } from '../../../utils/peerCalendar.ts'
import { ColorPicker } from '../../events/index.ts'
import { usePeerCalendars } from '../hooks/usePeerCalendars.ts'

function PeerCalendarCard({ calendar, onRemove }: { calendar: PeerCalendar; onRemove: () => void }) {
  const { m } = useI18n()
  const text = m.peers.settings
  const { update } = usePeerCalendars()
  const recolor = useAsyncAction((color: EventColor) => update(calendar.id, { color }))

  return (
    <li className="calendarSettingCard">
      <div className="calendarSettingHeader">
        <span {...getEventColorAttributes(calendar.color, 'colorSwatch')} aria-hidden="true" />
        <span className="itemRowMain">
          <span className="itemRowTitle">{m.peers.calendarName(calendar.ownerName)}</span>
        </span>
      </div>
      <div className="calendarSettingBody">
        <AsyncSwitch label={text.show} checked={calendar.shown} onChange={(shown) => update(calendar.id, { shown })} />
        <ColorPicker value={calendar.color} onChange={(color) => void recolor.run(color)} />
        <ActionFeedback error={recolor.error} />
        <div className="formActions">
          <Button variant="dangerOutline" onClick={onRemove}>
            {text.remove}
          </Button>
        </div>
      </div>
    </li>
  )
}

export function PeerCalendarSettings() {
  const { m } = useI18n()
  const text = m.peers.settings
  const { isAvailable, calendars, error, leave } = usePeerCalendars()
  const removal = useConfirm<PeerCalendar>()
  const toRemove = removal.target

  if (!isAvailable) return null

  return (
    <PageSection title={text.title} description={text.description}>
      <ErrorMessage message={error} />
      <ItemList items={calendars} empty={text.empty} className="calendarSettingList">
        {(calendar) => (
          <PeerCalendarCard key={calendar.id} calendar={calendar} onRemove={() => removal.ask(calendar)} />
        )}
      </ItemList>
      {toRemove && (
        <ConfirmModal
          title={text.removeTitle}
          confirmLabel={text.remove}
          pendingLabel={text.removing}
          onConfirm={() => leave(toRemove.id)}
          onClose={removal.close}
        >
          {text.removeMessage(toRemove.ownerName)}
        </ConfirmModal>
      )}
    </PageSection>
  )
}
