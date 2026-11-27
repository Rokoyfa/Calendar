import { useMemo } from 'react'
import { matchesCategoryFilter, type Category, type CategoryFilter } from '../../../domain/category.ts'
import { expandEvents, type CalendarEvent } from '../../../domain/event.ts'
import type { DateRange } from '../../../utils/date.ts'
import { isCaldavEvent } from '../../caldav/index.ts'
import { isExternalEvent } from '../../external/index.ts'
import { isPeerEvent } from '../../peers/index.ts'
import { isPlanPreviewEvent, toPlanPreviewEvents, type TaskPlanPreview } from '../../tasks/index.ts'
import { isDraftEvent } from '../utils/draftEvent.ts'
import { groupSegmentsByDate } from '../utils/segmentEvents.ts'
import type { DragPreview } from './useEventDrag.ts'

type CalendarOccurrenceOptions = {
  events: readonly CalendarEvent[]
  externalEvents: readonly CalendarEvent[]
  range: DateRange
  viewerTimeZone: string
  categories: readonly Category[]
  filter: CategoryFilter
  planPreview: TaskPlanPreview | null
  draft: CalendarEvent | null
  dragPreview: DragPreview | null
  canEditEvent: (event: CalendarEvent) => boolean
}

export function useCalendarOccurrences({
  events,
  externalEvents,
  range,
  viewerTimeZone,
  categories,
  filter,
  planPreview,
  draft,
  dragPreview,
  canEditEvent,
}: CalendarOccurrenceOptions) {
  const filtered = useMemo(() => {
    const all = externalEvents.length > 0 ? [...events, ...externalEvents] : events
    const expanded = expandEvents(all, range.from, range.to, viewerTimeZone)
    if (filter === null) return expanded
    const known = new Set(categories.map((category) => category.id))
    return expanded.filter(
      (occurrence) =>
        isExternalEvent(occurrence) ||
        isCaldavEvent(occurrence) ||
        isPeerEvent(occurrence) ||
        matchesCategoryFilter(occurrence.categoryIds, known, filter, occurrence.builtinCategories),
    )
  }, [events, externalEvents, range, viewerTimeZone, categories, filter])
  const occurrences = useMemo(() => {
    const drafted = draft ? expandEvents([draft], range.from, range.to, viewerTimeZone) : []
    if (!planPreview) return drafted.length > 0 ? [...filtered, ...drafted] : filtered
    const hidden = new Set(planPreview.replacedIds)
    const planned = expandEvents(toPlanPreviewEvents(planPreview), range.from, range.to, viewerTimeZone)
    return [...filtered.filter((occurrence) => !hidden.has(occurrence.id)), ...planned, ...drafted]
  }, [filtered, planPreview, draft, range, viewerTimeZone])
  const draggableByKey = useMemo(
    () =>
      new Map(
        occurrences
          .filter(
            (occurrence) =>
              !isExternalEvent(occurrence) &&
              !isPlanPreviewEvent(occurrence) &&
              !isDraftEvent(occurrence) &&
              ((!isCaldavEvent(occurrence) && !isPeerEvent(occurrence)) || canEditEvent(occurrence)),
          )
          .map((occurrence) => [occurrence.occurrenceKey, occurrence]),
      ),
    [occurrences, canEditEvent],
  )
  const segmentsByDate = useMemo(() => {
    const shown = dragPreview
      ? occurrences.map((occurrence) =>
          occurrence.occurrenceKey === dragPreview.occurrenceKey
            ? { ...occurrence, ...dragPreview.period }
            : occurrence,
        )
      : occurrences
    return groupSegmentsByDate(shown, range)
  }, [occurrences, dragPreview, range])
  return { occurrences, draggableByKey, segmentsByDate }
}
