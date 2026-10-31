import { toSeriesRule, type EditScope, type EventOccurrence } from '../../../utils/event.ts'
import { isSameRecurrence, type Recurrence } from '../../../utils/recurrence.ts'
import { hasEarlierOccurrences } from '../../../utils/series.ts'

export const getScopeOptions = (
  occurrence: EventOccurrence | null,
  nextRecurrence: Recurrence | null = occurrence?.recurrence ?? null,
): EditScope[] => {
  if (!occurrence?.recurrence) return ['all']
  const options: EditScope[] = []
  if (isSameRecurrence(occurrence.recurrence, nextRecurrence)) options.push('single')
  if (hasEarlierOccurrences(toSeriesRule(occurrence), occurrence.startDate)) options.push('following')
  options.push('all')
  return options
}
