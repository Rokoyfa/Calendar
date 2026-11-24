import type { Messages } from '../types.ts'
import { events } from './events.ts'
import { auth } from './auth.ts'
import { calendars } from './calendars.ts'
import { settings } from './settings.ts'
import { storage } from './storage.ts'
import { security } from './security.ts'
import { inbox } from './inbox.ts'
import { external } from './external.ts'
import { caldav } from './caldav.ts'
import { bookings } from './bookings.ts'
import { calendar, views } from './calendar.ts'
import { colors, common, errors, recurrence, themes, validation } from './core.ts'

export const de: Messages = {
  common,
  errors,
  validation,
  colors,
  themes,
  recurrence,
  views,
  calendar,
  events,
  storage,
  settings,
  auth,
  calendars,
  security,
  inbox,
  external,
  caldav,
  bookings,
}
