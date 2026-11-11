const KEY_PREFIX = 'calendar.activeCalendar.v1'

const toKey = (scope: string) => `${KEY_PREFIX}.${scope}`

export const readActiveCalendarId = (scope: string) => {
  try {
    return localStorage.getItem(toKey(scope))
  } catch {
    return null
  }
}

export const writeActiveCalendarId = (scope: string, id: string) => {
  try {
    localStorage.setItem(toKey(scope), id)
  } catch {
    return
  }
}
