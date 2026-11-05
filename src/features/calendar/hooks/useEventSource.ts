import { use } from 'react'
import type { CalendarEvent } from '../../../utils/event.ts'
import { EventSourcesContext } from '../context/EventSourcesContext.ts'

export const useEventSource = ({ calendarId }: Pick<CalendarEvent, 'calendarId'>) =>
  use(EventSourcesContext).get(calendarId)
