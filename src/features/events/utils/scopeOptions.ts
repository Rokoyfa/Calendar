import { toSeriesRule, type EditScope, type EventOccurrence } from '../../../domain/event.ts'
import { isSameRecurrence, type Recurrence } from '../../../domain/recurrence.ts'
import { hasEarlierOccurrences } from './series.ts'

export const getScopeOptions = (
  occurrence: EventOccurrence | null,
  nextRecurrence: Recurrence | null = occurrence?.recurrence ?? null,
): EditScope[] => {
  if (!occurrence?.recurrence) return ['all']
  const options: EditScope[] = []
  if (isSameRecurrence(occurrence.recurrence, nextRecurrence)) options.push('single')
  if (hasEarlierOccurrences(toSeriesRule(occurrence), occurrence.occurrenceDate)) options.push('following')
  options.push('all')
  return options
}
