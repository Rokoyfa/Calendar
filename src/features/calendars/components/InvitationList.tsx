import { DecisionButtons } from '../../../components/DecisionButtons.tsx'
import { PageSection } from '../../../components/PageSection.tsx'
import { useI18n } from '../../../i18n/index.ts'
import { useCalendars } from '../hooks/useCalendars.ts'
import type { PendingInvitation } from '../types/calendar.ts'
import { ItemList } from '../../../components/ItemList.tsx'

function InvitationRow({ invitation }: { invitation: PendingInvitation }) {
  const { m, format } = useI18n()
  const { invitations: text, roles } = m.calendars
  const { acceptInvitation, declineInvitation } = useCalendars()

  return (
    <li className="calendarSettingCard">
      <div className="calendarSettingHeader">
        <span className="itemRowMain">
          <span className="itemRowTitle">{invitation.teamName}</span>
          <span className="itemRowMeta">
            {invitation.invitedBy ? text.invitedBy(invitation.invitedBy) : text.invited} ·{' '}
            {text.validUntil(format.longDateOf(invitation.expiresAt))}
          </span>
          {invitation.description && <span className="itemRowMeta">{invitation.description}</span>}
        </span>
        <span className="badge">{roles[invitation.role]}</span>
      </div>
      <div className="calendarSettingBody">
        <DecisionButtons
          labels={text}
          onAccept={() => acceptInvitation(invitation.id)}
          onDecline={() => declineInvitation(invitation.id)}
        />
      </div>
    </li>
  )
}

export function InvitationList() {
  const { m } = useI18n()
  const { invitations } = useCalendars()

  return (
    <PageSection title={m.calendars.invitations.title} description={m.calendars.invitations.description}>
      <ItemList items={invitations} empty={m.calendars.invitations.empty} className="calendarSettingList">
        {(invitation) => <InvitationRow key={invitation.id} invitation={invitation} />}
      </ItemList>
    </PageSection>
  )
}
