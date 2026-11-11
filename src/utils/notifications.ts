export type NotificationState = 'unsupported' | NotificationPermission

export const getNotificationState = (): NotificationState =>
  typeof Notification === 'undefined' ? 'unsupported' : Notification.permission

export const requestNotifications = async (): Promise<NotificationState> => {
  const state = getNotificationState()
  if (state !== 'default') return state
  try {
    return await Notification.requestPermission()
  } catch {
    return getNotificationState()
  }
}
