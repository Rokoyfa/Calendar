import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { BellIcon, CloseIcon } from '../../../components/Icons.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { ROUTES, SETTINGS_INVITATIONS_PATH } from '../../../config/routes.ts'
import { useFeatures } from '../../../context/HostContext.ts'
import { useViewerTimeZone } from '../../../context/TimeZoneContext.ts'
import { useI18n } from '../../../i18n/index.ts'
import { classNames } from '../../../utils/classNames.ts'
import type { AppNotification } from '../utils/notification.ts'
import { placeBelowTrigger } from '../../../utils/popover.ts'
import { formatTimestamp } from '../../../utils/timestamp.ts'
import { useAuth } from '../../authorization/index.ts'
import { useCalendars } from '../../calendars/index.ts'
import { useStorage } from '../../storage/index.ts'
import { useNotifications } from '../hooks/useNotifications.ts'
import { ItemList } from '../../../components/ItemList.tsx'

const POPOVER_ID = 'notificationMenu'
const MAX_BADGE = 99
const NO_TARGET_KINDS: ReadonlySet<AppNotification['kind']> = new Set([
  'eventRequestAccepted',
  'eventRequestDeclined',
  'eventRequestWithdrawn',
])

const TASK_KINDS: ReadonlySet<AppNotification['kind']> = new Set(['taskAssigned', 'taskDueSoon', 'taskPlanConflict'])

const targetOf = (notification: AppNotification, calendarIds: ReadonlySet<string>) => {
  if (notification.kind === 'teamInvitation' || notification.kind === 'calendarShareInvitation')
    return SETTINGS_INVITATIONS_PATH
  if (NO_TARGET_KINDS.has(notification.kind)) return null
  if (TASK_KINDS.has(notification.kind)) {
    const { task } = notification
    if (!task || !calendarIds.has(task.calendarId)) return null
    const params = new URLSearchParams({ calendar: task.calendarId, task: task.id })
    if (notification.kind !== 'taskAssigned') params.set('plan', '1')
    return `${ROUTES.calendar}?${params}`
  }
  const { event } = notification
  if (!event || !calendarIds.has(event.calendarId)) return null
  const params = new URLSearchParams({ calendar: event.calendarId, event: event.id, date: event.startDate })
  if (notification.kind === 'chatMessage') params.set('tab', 'chat')
  return `${ROUTES.calendar}?${params}`
}

export function NotificationBell() {
  const { notifications: isEnabled } = useFeatures()
  const { user } = useAuth()
  const { notifications: repository } = useStorage()
  if (!isEnabled || !user || !repository) return null
  return <ActiveBell repository={repository} />
}

function ActiveBell({ repository }: { repository: NonNullable<ReturnType<typeof useStorage>['notifications']> }) {
  const { m, locale } = useI18n()
  const text = m.inbox
  const timeZone = useViewerTimeZone()
  const navigate = useNavigate()
  const { notifications, unread, hasMore, error, markRead, remove, loadMore } = useNotifications(repository)
  const { calendars } = useCalendars()
  const calendarIds = useMemo(() => new Set(calendars.map(({ id }) => id)), [calendars])

  const describe = (notification: AppNotification) => {
    const actor = notification.actor?.name || text.someone
    const title = notification.event?.title ?? notification.task?.title ?? ''
    switch (notification.kind) {
      case 'teamInvitation':
        return text.kinds.teamInvitation(actor, notification.team?.name ?? '')
      case 'calendarShareInvitation':
        return text.kinds.calendarShareInvitation(actor)
      case 'reminder':
      case 'bookingCreated':
      case 'bookingCanceled':
        return text.kinds[notification.kind](title)
      case 'taskDueSoon':
        return text.kinds.taskDueSoon(notification.task?.title ?? '')
      case 'taskPlanConflict':
        return text.kinds.taskPlanConflict(actor, notification.event?.title ?? '', notification.task?.title ?? '')
      default:
        return text.kinds[notification.kind](actor, title)
    }
  }

  const open = (notification: AppNotification, menu: HTMLElement | null) => {
    if (!notification.readAt) void markRead([notification.id])
    const target = targetOf(notification, calendarIds)
    menu?.hidePopover()
    if (target) void navigate(target)
  }

  return (
    <>
      <button
        type="button"
        className="iconLink notificationButton"
        popoverTarget={POPOVER_ID}
        aria-label={unread > 0 ? text.openUnread(unread) : text.open}
        title={text.open}
      >
        <BellIcon size={20} />
        {unread > 0 && (
          <span className="notificationBadge" aria-hidden="true">
            {unread > MAX_BADGE ? `${MAX_BADGE}+` : unread}
          </span>
        )}
      </button>
      <div id={POPOVER_ID} popover="auto" className="notificationPopover surface" onBeforeToggle={placeBelowTrigger}>
        <div className="notificationHeader">
          <h2 className="notificationTitle">{text.title}</h2>
          {unread > 0 && (
            <button type="button" className="linkButton" onClick={() => void markRead()}>
              {text.markAllRead}
            </button>
          )}
        </div>
        <ErrorMessage message={error} />
        <ItemList items={notifications} empty={text.empty} className="notificationList">
          {(notification) => (
            <li key={notification.id} className={classNames('notificationItem', !notification.readAt && 'isUnread')}>
              <button
                type="button"
                className="notificationOpen"
                onClick={(event) => open(notification, event.currentTarget.closest<HTMLElement>('[popover]'))}
              >
                <span className="notificationText">{describe(notification)}</span>
                <time className="notificationTime" dateTime={notification.createdAt}>
                  {formatTimestamp(notification.createdAt, locale, timeZone)}
                </time>
              </button>
              <button
                type="button"
                className="iconButton iconButton--plain notificationRemove"
                aria-label={text.remove}
                title={text.remove}
                onClick={() => void remove(notification.id)}
              >
                <CloseIcon size={16} />
              </button>
            </li>
          )}
        </ItemList>
        {hasMore && (
          <button type="button" className="linkButton" onClick={() => void loadMore()}>
            {text.loadMore}
          </button>
        )}
      </div>
    </>
  )
}
