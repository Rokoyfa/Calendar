import type { EventInput, EventOccurrence } from '../../../utils/event.ts'

export type EditorState = {
  initialValue: EventInput
  occurrence: EventOccurrence | null
}
