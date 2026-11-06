import { Button } from '../../../components/Button.tsx'
import { PageSection } from '../../../components/PageSection.tsx'
import { ActionFeedback } from '../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useI18n } from '../../../i18n/index.ts'
import { toISODate } from '../../../utils/date.ts'
import { useCalendars } from '../hooks/useCalendars.ts'
import type { PendingInvitation } from '../types/calendar.ts'

function InvitationRow({ invitation }: { invitation: PendingInvitation }) {
  const { m, format } = useI18n()
  const { invitations: text, roles } = m.calendars
  const { acceptInvitation, declineInvitation } = useCalendars()
  const accept = useAsyncAction(() => acceptInvitation(invitation.id))
  const decline = useAsyncAction(() => declineInvitation(invitation.id))
  const isBusy = accept.isPending || decline.isPending

  return (
    <li className="calendarSettingCard">
      <div className="calendarSettingHeader">
        <span className="itemRowMain">
          <span className="itemRowTitle">{invitation.teamName}</span>
          <span className="itemRowMeta">
            {invitation.invitedBy ? text.invitedBy(invitation.invitedBy) : text.invited} ·{' '}
            {text.validUntil(format.longDate(toISODate(new Date(invitation.expiresAt))))}
          </span>
          {invitation.description && <span className="itemRowMeta">{invitation.description}</span>}
        </span>
        <span className="badge">{roles[invitation.role]}</span>
      </div>
      <div className="calendarSettingBody">
        <ActionFeedback error={accept.error ?? decline.error} />
        <div className="formActions">
          <Button
            variant="outline"
            disabled={isBusy}
            isPending={decline.isPending}
            pendingLabel={text.declining}
            onClick={() => void decline.run()}
          >
            {text.decline}
          </Button>
          <Button
            disabled={isBusy}
            isPending={accept.isPending}
            pendingLabel={text.accepting}
            onClick={() => void accept.run()}
          >
            {text.accept}
          </Button>
        </div>
      </div>
    </li>
  )
}

export function InvitationList() {
  const { m } = useI18n()
  const { invitations } = useCalendars()
  if (invitations.length === 0) return null

  return (
    <PageSection
      title={m.calendars.invitations.title}
      description={m.calendars.invitations.description}
    >
      <ul className="calendarSettingList">
        {invitations.map((invitation) => (
          <InvitationRow key={invitation.id} invitation={invitation} />
        ))}
      </ul>
    </PageSection>
  )
}
