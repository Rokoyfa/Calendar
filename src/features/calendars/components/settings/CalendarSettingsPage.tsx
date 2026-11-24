import { useParams } from 'react-router'
import { useI18n } from '../../../../i18n/index.ts'
import { PageLayout } from '../../../../components/PageLayout.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { Tabs, type TabDefinition } from '../../../../components/Tabs.tsx'
import { SETTINGS_CALENDARS_PATH } from '../../../../config/routes.ts'
import { useTabParam } from '../../../../hooks/useTabParam.ts'
import { useFeatures } from '../../../../context/HostContext.ts'
import { useAuth } from '../../../authorization/index.ts'
import { useCalendars } from '../../hooks/useCalendars.ts'
import { useTeam } from '../../hooks/useTeam.ts'
import type { CalendarSummary } from '../../types/calendar.ts'
import { ShowInPersonalSwitch } from '../ShowInPersonalSwitch.tsx'
import { canManageCategories, canUseTrash, hasPermission, isPersonalCalendar } from '../../utils/permissions.ts'
import { TrashSection } from './TrashSection.tsx'
import { DangerSection } from './DangerSection.tsx'
import { ExchangeSection } from './ExchangeSection.tsx'
import { SubscribeSection } from './SubscribeSection.tsx'
import { ShareSection } from './ShareSection.tsx'
import { CategoriesSection } from '../../../categories/index.ts'
import { GeneralSection } from './GeneralSection.tsx'
import { MembersSection } from './MembersSection.tsx'
import { TeamInvitationsSection } from './TeamInvitationsSection.tsx'
import { compact } from '../../../../utils/list.ts'
import { BookingPagesSection } from '../../../bookings/index.ts'
import { useStorage } from '../../../storage/index.ts'
import { SharingSection } from '../../../peers/index.ts'

function DisplaySection({ calendar }: { calendar: CalendarSummary }) {
  const { m } = useI18n()
  return (
    <PageSection title={m.calendars.settings.displayTitle} description={m.calendars.settings.displayDescription}>
      <ShowInPersonalSwitch calendar={calendar} />
    </PageSection>
  )
}

type TeamTab = 'general' | 'members' | 'invitations' | 'booking' | 'exchange' | 'trash' | 'danger'
type PersonalTab = 'general' | 'sharing' | 'booking' | 'exchange' | 'trash'

function useCommonTabs(calendar: CalendarSummary, canOpenTrash: boolean) {
  const { m } = useI18n()
  const { settings } = m.calendars
  const { subscriptions, importExport, trash, bookingPages } = useFeatures()
  const { bookings, mode } = useStorage()
  return {
    booking: bookingPages &&
      bookings &&
      mode === 'remote' &&
      hasPermission(calendar, 'manage_calendars') && {
        value: 'booking' as const,
        label: settings.tabs.booking,
        content: <BookingPagesSection calendarId={calendar.id} repository={bookings} />,
      },
    exchange: (subscriptions || importExport) && {
      value: 'exchange' as const,
      label: settings.tabs.exchange,
      content: (
        <>
          {subscriptions && <SubscribeSection calendar={calendar} />}
          {importExport && <ExchangeSection calendar={calendar} />}
        </>
      ),
    },
    trash: trash &&
      canOpenTrash && {
        value: 'trash' as const,
        label: settings.tabs.trash,
        content: <TrashSection calendar={calendar} />,
      },
  }
}

function TeamSettings({ calendar }: { calendar: CalendarSummary }) {
  const { m } = useI18n()
  const { settings } = m.calendars
  const { withCount } = settings
  const { user } = useAuth()
  const team = useTeam(calendar)
  const { publicLinks } = useFeatures()
  const common = useCommonTabs(calendar, canUseTrash(calendar))
  const canManage = hasPermission(calendar, 'manage_calendars')
  const tabs = compact<TabDefinition<TeamTab>>([
    {
      value: 'general',
      label: settings.tabs.general,
      content: (
        <>
          <GeneralSection calendar={calendar} />
          <DisplaySection calendar={calendar} />
          <CategoriesSection calendarId={calendar.id} canManage={canManageCategories(calendar)} />
          {publicLinks && canManage && <ShareSection calendar={calendar} />}
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
    hasPermission(calendar, 'invite_members') && {
      value: 'invitations',
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
    common.booking,
    common.exchange,
    common.trash,
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
  ])
  const [active, select] = useTabParam(tabs)

  return <Tabs label={settings.tabsLabel} tabs={tabs} value={active} onChange={select} />
}

function PersonalSettings({ calendar }: { calendar: CalendarSummary }) {
  const { m } = useI18n()
  const { settings } = m.calendars
  const { publicLinks, personalSharing: sharingFeature } = useFeatures()
  const { personalSharing, mode } = useStorage()
  const { user } = useAuth()
  const common = useCommonTabs(calendar, true)
  const canManage = hasPermission(calendar, 'manage_calendars')
  const tabs = compact<TabDefinition<PersonalTab>>([
    {
      value: 'general',
      label: settings.tabs.general,
      content: (
        <>
          {canManage && <GeneralSection calendar={calendar} />}
          <CategoriesSection calendarId={calendar.id} canManage={canManageCategories(calendar)} />
          {publicLinks && canManage && <ShareSection calendar={calendar} />}
          <PageSection title={settings.personalTitle}>
            <p className="formHint">{settings.personalHint}</p>
          </PageSection>
        </>
      ),
    },
    sharingFeature &&
      personalSharing &&
      mode === 'remote' &&
      user && {
        value: 'sharing',
        label: m.peers.sharing.tab,
        content: <SharingSection repository={personalSharing} />,
      },
    common.booking,
    common.exchange,
    common.trash,
  ])
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
      {isPersonalCalendar(calendar) ? <PersonalSettings calendar={calendar} /> : <TeamSettings calendar={calendar} />}
    </PageLayout>
  )
}
