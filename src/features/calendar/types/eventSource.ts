import type { EventColor } from '../../../domain/event.ts'

export type EventSource = {
  name: string
  color: EventColor
}

export type EventSources = ReadonlyMap<string, EventSource>
