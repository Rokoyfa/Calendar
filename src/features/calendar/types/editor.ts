import type { CalendarEvent, EventInput } from '../../../utils/event.ts'
import type { EventModalMode } from '../../events/index.ts'

export type EditorState =
  | { mode: Extract<EventModalMode, 'create'>; initialValue: EventInput }
  | { mode: Extract<EventModalMode, 'edit'>; event: CalendarEvent }
