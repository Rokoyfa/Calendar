import { useCallback, useMemo } from 'react'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.ts'
import { useI18n } from '../../../i18n/index.ts'
import { isISODate, isTime, timeToMinutes } from '../../../utils/date.ts'
import type { EventInput, EventOccurrence } from '../../../utils/event.ts'
import { OVERLAPS_SHOWN, type OverlapQuery } from '../../../utils/overlap.ts'

export type OverlapCheck = (query: OverlapQuery) => Promise<readonly EventOccurrence[]>

const NONE: readonly EventOccurrence[] = []
const DELAY_MS = 400

const toQuery = ({ uid, startDate, start, endDate, end, allDay, timeZone }: EventInput): OverlapQuery | null =>
  !allDay && isISODate(startDate) && isISODate(endDate) && isTime(start) && isTime(end)
    ? { uid, startDate, start, endDate, end, allDay, timeZone }
    : null

export function OverlapNotice({ values, check }: { values: EventInput; check: OverlapCheck }) {
  const { m, format } = useI18n()
  const key = useDebouncedValue(JSON.stringify(toQuery(values)), DELAY_MS)
  const query = useMemo(() => JSON.parse(key) as OverlapQuery | null, [key])
  const load = useCallback(() => (query ? check(query) : Promise.resolve(NONE)), [query, check])
  const { data: overlaps } = useAsyncResource(load, NONE)

  if (overlaps.length === 0) return null
  const names = overlaps
    .slice(0, OVERLAPS_SHOWN)
    .map(({ title, start, end }) =>
      m.events.overlapItem(title, format.time(timeToMinutes(start)), format.time(timeToMinutes(end))),
    )
  const more = overlaps.length - names.length
  return (
    <p className="overlapNotice formHint" role="status">
      {m.events.overlap(names.join(', '), more)}
    </p>
  )
}
