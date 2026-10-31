import { addDaysToISODate } from '../../../utils/date.ts'
import { toEventInput, type CalendarEvent, type EditScope, type EventInput } from '../../../utils/event.ts'
import {
  changeWholeSeries,
  continueSeries,
  detachOccurrence,
  excludeOccurrence,
  getShift,
  hasEarlierOccurrences,
  truncateSeries,
} from '../../../utils/series.ts'
import type { EventRepository } from '../../storage/index.ts'

const resolveScope = (series: CalendarEvent, occurrenceDate: string, scope: EditScope): EditScope =>
  scope === 'following' && !hasEarlierOccurrences({ ...series, seriesStartDate: series.startDate }, occurrenceDate)
    ? 'all'
    : scope

const listDetached = async (repository: EventRepository, series: CalendarEvent) =>
  (await repository.listSeries(series.id)).filter((event) => event.seriesId === series.id)

const relink = (event: CalendarEvent, seriesId: string | null, shift: number): EventInput => ({
  ...toEventInput(event),
  seriesId,
  originalDate: seriesId === null || event.originalDate === null ? null : addDaysToISODate(event.originalDate, shift),
})

export async function updateOccurrence(
  repository: EventRepository,
  series: CalendarEvent,
  occurrenceDate: string,
  input: EventInput,
  requestedScope: EditScope,
) {
  if (!series.recurrence) {
    await repository.update(series.id, input)
    return
  }

  const scope = resolveScope(series, occurrenceDate, requestedScope)
  const shift = getShift(occurrenceDate, input)

  if (scope === 'single') {
    await repository.update(series.id, excludeOccurrence(series, occurrenceDate))
    await repository.create(detachOccurrence(series, occurrenceDate, input))
    return
  }

  const detached = await listDetached(repository, series)

  if (scope === 'all') {
    await repository.update(series.id, changeWholeSeries(series, occurrenceDate, input))
    const seriesId = input.recurrence ? series.id : null
    for (const event of detached) {
      if (seriesId === null || shift !== 0) await repository.update(event.id, relink(event, seriesId, shift))
    }
    return
  }

  await repository.update(series.id, truncateSeries(series, occurrenceDate))
  const created = await repository.create(continueSeries(series, occurrenceDate, input))
  const seriesId = created.recurrence ? created.id : null
  for (const event of detached) {
    if (event.originalDate !== null && event.originalDate >= occurrenceDate)
      await repository.update(event.id, relink(event, seriesId, shift))
  }
}

export async function deleteOccurrence(
  repository: EventRepository,
  series: CalendarEvent,
  occurrenceDate: string,
  requestedScope: EditScope,
) {
  if (!series.recurrence) {
    await repository.remove(series.id)
    return
  }

  const scope = resolveScope(series, occurrenceDate, requestedScope)

  if (scope === 'single') {
    await repository.update(series.id, excludeOccurrence(series, occurrenceDate))
    return
  }

  const detached = await listDetached(repository, series)

  if (scope === 'all') {
    for (const event of detached) await repository.remove(event.id)
    await repository.remove(series.id)
    return
  }

  await repository.update(series.id, truncateSeries(series, occurrenceDate))
  for (const event of detached) {
    if (event.originalDate !== null && event.originalDate >= occurrenceDate) await repository.remove(event.id)
  }
}
