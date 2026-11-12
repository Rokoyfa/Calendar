import type { EventInput, EventOccurrence } from '../../../utils/event.ts'
import type { EventTab } from '../../events/index.ts'

export type EditorState = {
  initialValue: EventInput
  occurrence: EventOccurrence | null
  notice?: string
  initialTab?: EventTab
}
