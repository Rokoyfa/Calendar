import type { Messages } from '../types.ts'
import { events } from './events.ts'
import { auth } from './auth.ts'
import { calendars } from './calendars.ts'
import { settings } from './settings.ts'
import { storage } from './storage.ts'
import { calendar, views } from './calendar.ts'
import { colors, common, errors, recurrence, themes, validation } from './core.ts'

export const de: Messages = { common, errors, validation, colors, themes, recurrence, views, calendar, events, storage, settings, auth, calendars }
