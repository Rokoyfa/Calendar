import { Button } from '../../../components/Button.tsx'
import { PageSection } from '../../../components/PageSection.tsx'
import { ActionFeedback } from '../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { formatLongDate, toISODate } from '../../../utils/date.ts'
import { ROLE_LABELS } from '../constants/calendars.ts'
import { useCalendars } from '../hooks/useCalendars.ts'
import type { PendingInvitation } from '../types/calendar.ts'

function InvitationRow({ invitation }: { invitation: PendingInvitation }) {
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
            {invitation.invitedBy ? `${invitation.invitedBy} lädt dich ein` : 'Du bist eingeladen'} · gültig bis{' '}
            {formatLongDate(toISODate(new Date(invitation.expiresAt)))}
          </span>
          {invitation.description && <span className="itemRowMeta">{invitation.description}</span>}
        </span>
        <span className="badge">{ROLE_LABELS[invitation.role]}</span>
      </div>
      <div className="calendarSettingBody">
        <ActionFeedback error={accept.error ?? decline.error} />
        <div className="formActions">
          <Button
            variant="outline"
            disabled={isBusy}
            isPending={decline.isPending}
            pendingLabel="Wird abgelehnt …"
            onClick={() => void decline.run()}
          >
            Ablehnen
          </Button>
          <Button
            disabled={isBusy}
            isPending={accept.isPending}
            pendingLabel="Wird angenommen …"
            onClick={() => void accept.run()}
          >
            Annehmen
          </Button>
        </div>
      </div>
    </li>
  )
}

export function InvitationList() {
  const { invitations } = useCalendars()
  if (invitations.length === 0) return null

  return (
    <PageSection
      title="Einladungen"
      description="Du wurdest in diese Kalender eingeladen. Nach dem Annehmen erscheinen sie unten und in „Kalender wechseln“."
    >
      <ul className="calendarSettingList">
        {invitations.map((invitation) => (
          <InvitationRow key={invitation.id} invitation={invitation} />
        ))}
      </ul>
    </PageSection>
  )
}
