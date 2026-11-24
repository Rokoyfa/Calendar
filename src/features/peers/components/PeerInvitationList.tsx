import { DecisionButtons } from '../../../components/DecisionButtons.tsx'
import { ItemList } from '../../../components/ItemList.tsx'
import { PageSection } from '../../../components/PageSection.tsx'
import { useI18n } from '../../../i18n/index.ts'
import type { PeerCalendar } from '../../../utils/peerCalendar.ts'
import { usePeerCalendars } from '../hooks/usePeerCalendars.ts'

function PeerInvitationRow({ invitation }: { invitation: PeerCalendar }) {
  const { m, format } = useI18n()
  const text = m.peers.invitations
  const { accept, decline } = usePeerCalendars()

  return (
    <li className="calendarSettingCard">
      <div className="calendarSettingHeader">
        <span className="itemRowMain">
          <span className="itemRowTitle">{text.from(invitation.ownerName)}</span>
          {invitation.expiresAt && (
            <span className="itemRowMeta">{text.validUntil(format.longDateOf(invitation.expiresAt))}</span>
          )}
        </span>
      </div>
      <div className="calendarSettingBody">
        <DecisionButtons
          labels={text}
          onAccept={() => accept(invitation.id)}
          onDecline={() => decline(invitation.id)}
        />
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
