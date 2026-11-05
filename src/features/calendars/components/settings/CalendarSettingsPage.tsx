import { useParams } from 'react-router'
import { PageLayout } from '../../../../components/PageLayout.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { Switch } from '../../../../components/Switch.tsx'
import { ActionFeedback } from '../../../../components/StatusMessage.tsx'
import { SETTINGS_CALENDARS_PATH } from '../../../../config/routes.ts'
import { useAsyncAction } from '../../../../hooks/useAsyncAction.ts'
import { useAuth } from '../../../authorization/index.ts'
import { useCalendars } from '../../hooks/useCalendars.ts'
import { useTeam } from '../../hooks/useTeam.ts'
import type { CalendarSummary } from '../../types/calendar.ts'
import { hasPermission, isPersonalCalendar } from '../../utils/permissions.ts'
import { DangerSection } from './DangerSection.tsx'
import { GeneralSection } from './GeneralSection.tsx'
import { MembersSection } from './MembersSection.tsx'
import { TeamInvitationsSection } from './TeamInvitationsSection.tsx'

const BACK = { to: SETTINGS_CALENDARS_PATH, label: 'Zu den Einstellungen' }

function DisplaySection({ calendar }: { calendar: CalendarSummary }) {
  const { setShowInPersonal } = useCalendars()
  const { run, error } = useAsyncAction(setShowInPersonal)
  return (
    <PageSection title="Anzeige" description="Gilt nur für dich. Andere Mitglieder stellen das selbst ein.">
      <Switch
        label="Termine auch im persönlichen Kalender anzeigen"
        checked={calendar.showInPersonal}
        onChange={(checked) => void run(calendar.id, checked)}
      />
      <ActionFeedback error={error} />
    </PageSection>
  )
}

function TeamSettings({ calendar }: { calendar: CalendarSummary }) {
  const { user } = useAuth()
  const team = useTeam(calendar)

  return (
    <>
      <DisplaySection calendar={calendar} />
      <MembersSection
        calendar={calendar}
        members={team.members}
        error={team.membersError}
        currentUserId={user?.id ?? null}
        onChangeRole={team.changeRole}
        onRemove={team.removeMember}
      />
      {hasPermission(calendar, 'invite_members') && (
        <TeamInvitationsSection
          calendar={calendar}
          invitations={team.invitations}
          members={team.members}
          error={team.invitationsError}
          ownEmail={user?.email ?? null}
          onInvite={team.invite}
          onRevoke={team.revokeInvitation}
        />
      )}
      <DangerSection calendar={calendar} members={team.members} />
    </>
  )
}

export function CalendarSettingsPage() {
  const { calendarId } = useParams()
  const { calendars, isLoading } = useCalendars()
  const calendar = calendars.find((entry) => entry.id === calendarId)

  if (!calendar)
    return (
      <PageLayout title="Kalender-Einstellungen" back={BACK} variant="full">
        <p className="emptyHint">
          {isLoading ? 'Lädt …' : 'Diesen Kalender gibt es nicht, oder du hast keinen Zugriff mehr.'}
        </p>
      </PageLayout>
    )

  return (
    <PageLayout title={`${calendar.name} · Einstellungen`} back={BACK} variant="full">
      <GeneralSection calendar={calendar} />
      {isPersonalCalendar(calendar) ? (
        <PageSection title="Persönlicher Kalender">
          <p className="formHint">
            Nur du siehst diesen Kalender. Er lässt sich nicht teilen, verlassen oder löschen. Termine aus
            Team-Kalendern blendest du in deren Einstellungen ein oder aus.
          </p>
        </PageSection>
      ) : (
        <TeamSettings calendar={calendar} />
      )}
    </PageLayout>
  )
}
