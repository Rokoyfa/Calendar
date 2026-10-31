import type { EditScope } from '../../../utils/event.ts'

export const EDIT_SCOPE_LABELS: Record<EditScope, string> = {
  single: 'Nur dieser Termin',
  following: 'Dieser und alle folgenden',
  all: 'Alle Termine',
}
