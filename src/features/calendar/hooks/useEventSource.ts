import { use } from 'react'
import type { CalendarEvent } from '../../../domain/event.ts'
import { EventSourcesContext } from '../context/EventSourcesContext.ts'

export const useEventSources = () => use(EventSourcesContext)

export const useEventSource = ({ calendarId }: Pick<CalendarEvent, 'calendarId'>) =>
  use(EventSourcesContext).get(calendarId)
