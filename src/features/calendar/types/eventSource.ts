import type { EventColor } from '../../../utils/event.ts'

export type EventSource = {
  name: string
  color: EventColor
}

export type EventSources = ReadonlyMap<string, EventSource>
