import { Button } from '../../../components/Button.tsx'
import { ItemList } from '../../../components/ItemList.tsx'
import { PageSection } from '../../../components/PageSection.tsx'
import { ActionFeedback } from '../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useI18n } from '../../../i18n/index.ts'
import { toISODate } from '../../../utils/date.ts'
import type { PeerCalendar } from '../../../utils/peerCalendar.ts'
import { usePeerCalendars } from '../hooks/usePeerCalendars.ts'

function PeerInvitationRow({ invitation }: { invitation: PeerCalendar }) {
  const { m, format } = useI18n()
  const text = m.peers.invitations
  const { accept, decline } = usePeerCalendars()
  const accepting = useAsyncAction(() => accept(invitation.id))
  const declining = useAsyncAction(() => decline(invitation.id))
  const isBusy = accepting.isPending || declining.isPending

  return (
    <li className="calendarSettingCard">
      <div className="calendarSettingHeader">
        <span className="itemRowMain">
          <span className="itemRowTitle">{text.from(invitation.ownerName)}</span>
          {invitation.expiresAt && (
            <span className="itemRowMeta">
              {text.validUntil(format.longDate(toISODate(new Date(invitation.expiresAt))))}
            </span>
          )}
        </span>
      </div>
      <div className="calendarSettingBody">
        <ActionFeedback error={accepting.error ?? declining.error} />
        <div className="formActions">
          <Button
            variant="outline"
            disabled={isBusy}
            isPending={declining.isPending}
            pendingLabel={text.declining}
            onClick={() => void declining.run()}
          >
            {text.decline}
          </Button>
          <Button
            disabled={isBusy}
            isPending={accepting.isPending}
            pendingLabel={text.accepting}
            onClick={() => void accepting.run()}
          >
            {text.accept}
          </Button>
        </div>
      </div>
    </li>
  )
}

export function PeerInvitationList({ hideWhenEmpty = false }: { hideWhenEmpty?: boolean }) {
  const { m } = useI18n()
  const { isAvailable, invitations } = usePeerCalendars()

  if (!isAvailable || (hideWhenEmpty && invitations.length === 0)) return null

  return (
    <PageSection title={m.peers.invitations.title} description={m.peers.invitations.description}>
      <ItemList items={invitations} empty={m.calendars.invitations.empty} className="calendarSettingList">
        {(invitation) => <PeerInvitationRow key={invitation.id} invitation={invitation} />}
      </ItemList>
    </PageSection>
  )
}
