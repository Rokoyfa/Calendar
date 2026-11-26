import { useCallback, useMemo } from 'react'
import { Button } from '../../../components/Button.tsx'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.ts'
import { useI18n } from '../../../i18n/index.ts'
import { isISODate, isTime } from '../../../utils/date.ts'
import type { EventInput } from '../../../utils/event.ts'
import type { OverlapQuery } from '../../../utils/overlap.ts'

export type PlanConflict = { taskId: string; title: string }

export type PlanConflictCheck = (query: OverlapQuery) => Promise<readonly PlanConflict[]>

export const REPLAN_SUBMITTER = 'replanTask'

const NONE: readonly PlanConflict[] = []
const DELAY_MS = 400

const toQuery = ({ uid, startDate, start, endDate, end, allDay, timeZone }: EventInput): OverlapQuery | null =>
  !allDay && isISODate(startDate) && isISODate(endDate) && isTime(start) && isTime(end)
    ? { uid, startDate, start, endDate, end, allDay, timeZone }
    : null

type PlanConflictNoticeProps = {
  values: EventInput
  check: PlanConflictCheck
  canReplan: boolean
  isPending: boolean
}

export function PlanConflictNotice({ values, check, canReplan, isPending }: PlanConflictNoticeProps) {
  const { m, format } = useI18n()
  const key = useDebouncedValue(JSON.stringify(toQuery(values)), DELAY_MS)
  const query = useMemo(() => JSON.parse(key) as OverlapQuery | null, [key])
  const load = useCallback(() => (query ? check(query) : Promise.resolve(NONE)), [query, check])
  const { data: conflicts } = useAsyncResource(load, NONE)

  if (conflicts.length === 0) return null
  const titles = format.list(conflicts.map(({ title }) => m.events.planConflictTask(title)))
  return (
    <div className="overlapNotice planConflictNotice" role="status">
      <p>{m.events.planConflict(titles)}</p>
      {canReplan && (
        <Button
          type="submit"
          variant="outline"
          name={REPLAN_SUBMITTER}
          value={conflicts[0].taskId}
          disabled={isPending}
        >
          {m.events.saveAndReplan}
        </Button>
      )}
    </div>
  )
}
