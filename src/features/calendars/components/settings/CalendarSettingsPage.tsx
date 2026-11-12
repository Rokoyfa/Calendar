import { useParams } from 'react-router'
import { useI18n } from '../../../../i18n/index.ts'
import { PageLayout } from '../../../../components/PageLayout.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { Tabs, type TabDefinition } from '../../../../components/Tabs.tsx'
import { SETTINGS_CALENDARS_PATH } from '../../../../config/routes.ts'
import { useTabParam } from '../../../../hooks/useTabParam.ts'
import { useAuth } from '../../../authorization/index.ts'
import { useCalendars } from '../../hooks/useCalendars.ts'
import { useTeam } from '../../hooks/useTeam.ts'
import type { CalendarSummary } from '../../types/calendar.ts'
import { ShowInPersonalSwitch } from '../ShowInPersonalSwitch.tsx'
import { hasPermission, isPersonalCalendar } from '../../utils/permissions.ts'
import { DangerSection } from './DangerSection.tsx'
import { ExchangeSection } from './ExchangeSection.tsx'
import { SubscribeSection } from './SubscribeSection.tsx'
import { GeneralSection } from './GeneralSection.tsx'
import { MembersSection } from './MembersSection.tsx'
import { TeamInvitationsSection } from './TeamInvitationsSection.tsx'

function DisplaySection({ calendar }: { calendar: CalendarSummary }) {
  const { m } = useI18n()
  return (
    <PageSection title={m.calendars.settings.displayTitle} description={m.calendars.settings.displayDescription}>
      <ShowInPersonalSwitch calendar={calendar} />
    </PageSection>
  )
}

type TeamTab = 'general' | 'members' | 'invitations' | 'exchange' | 'danger'

function TeamSettings({ calendar }: { calendar: CalendarSummary }) {
  const { m } = useI18n()
  const { settings } = m.calendars
  const { withCount } = settings
  const { user } = useAuth()
  const team = useTeam(calendar)
  const tabs: TabDefinition<TeamTab>[] = [
    {
      value: 'general',
      label: settings.tabs.general,
      content: (
        <>
          <GeneralSection calendar={calendar} />
          <DisplaySection calendar={calendar} />
        </>
      ),
    },
    {
      value: 'members',
      label: withCount(settings.tabs.members, team.members.length),
      content: (
        <MembersSection
          calendar={calendar}
          members={team.members}
          error={team.membersError}
          currentUserId={user?.id ?? null}
          onChangeRole={team.changeRole}
          onRemove={team.removeMember}
        />
      ),
    },
    ...(hasPermission(calendar, 'invite_members')
      ? [
          {
            value: 'invitations' as const,
            label: withCount(settings.tabs.invitations, team.invitations.length),
            content: (
              <TeamInvitationsSection
                calendar={calendar}
                invitations={team.invitations}
                members={team.members}
                error={team.invitationsError}
                ownEmail={user?.email ?? null}
                onInvite={team.invite}
                onRevoke={team.revokeInvitation}
              />
            ),
          },
        ]
      : []),
    {
      value: 'exchange',
      label: settings.tabs.exchange,
      content: (
        <>
          <SubscribeSection calendar={calendar} />
          <ExchangeSection calendar={calendar} />
        </>
      ),
    },
    {
      value: 'danger',
      label: settings.tabs.danger,
      content: (
        <DangerSection
          calendar={calendar}
          members={team.members}
          currentUserId={user?.id ?? null}
          onOwnershipTransferred={team.reloadMembers}
        />
      ),
    },
  ]
  const [active, select] = useTabParam(tabs)

  return <Tabs label={settings.tabsLabel} tabs={tabs} value={active} onChange={select} />
}

export function CalendarSettingsPage() {
  const { m } = useI18n()
  const { settings } = m.calendars
  const back = { to: SETTINGS_CALENDARS_PATH, label: m.common.backToSettings }
  const { calendarId } = useParams()
  const { calendars, isLoading } = useCalendars()
  const calendar = calendars.find((entry) => entry.id === calendarId)

  if (!calendar)
    return (
      <PageLayout title={settings.title} back={back} variant="full">
        <p className="emptyHint">{isLoading ? m.common.loading : settings.notFound}</p>
      </PageLayout>
    )

  return (
    <PageLayout title={settings.pageTitle(calendar.name)} back={back} variant="full">
      {isPersonalCalendar(calendar) ? (
        <>
          {hasPermission(calendar, 'manage_calendars') && <GeneralSection calendar={calendar} />}
          <SubscribeSection calendar={calendar} />
          <ExchangeSection calendar={calendar} />
          <PageSection title={settings.personalTitle}>
            <p className="formHint">{settings.personalHint}</p>
          </PageSection>
        </>
      ) : (
        <TeamSettings calendar={calendar} />
      )}
    </PageLayout>
  )
}
