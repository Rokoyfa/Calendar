import { useCallback, useMemo, useState } from 'react'
import { Button } from '../../../components/Button.tsx'
import { Modal } from '../../../components/Modal.tsx'
import { SegmentedField } from '../../../components/SegmentedField.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import { useI18n } from '../../../i18n/index.ts'
import { timeToMinutes } from '../../../utils/date.ts'
import { PLANNING_DISTRIBUTIONS, type PlanningDistribution } from '../../../utils/preferences.ts'
import { useTaskPlanner, type TaskPlanContext } from '../hooks/useTaskPlanner.ts'
import type { Task, TaskPlanningSetup } from '../types/task.ts'
import { findEarliestCompletion, type PlannedBlock } from '../utils/taskPlanner.ts'
import { usePlanningCountryName } from '../hooks/usePlanningCountryName.ts'

type TaskPlanModalProps = {
  task: Task
  setup: TaskPlanningSetup
  onReschedule?: (task: Task, dueDate: string) => Promise<Task>
  onTaskChange: (task: Task) => void
  onPlanned: () => void
  onClose: () => void
}

const groupByDate = (blocks: readonly PlannedBlock[]) => {
  const days = new Map<string, PlannedBlock[]>()
  for (const block of blocks) days.set(block.date, [...(days.get(block.date) ?? []), block])
  return [...days]
}

export function TaskPlanModal({
  task: initialTask,
  setup,
  onReschedule,
  onTaskChange,
  onPlanned,
  onClose,
}: TaskPlanModalProps) {
  const { m, format } = useI18n()
  const text = m.tasks.plan
  const planner = useTaskPlanner(setup)
  const [task, setTask] = useState(initialTask)
  const [distribution, setDistribution] = useState<PlanningDistribution>(planner.distribution)
  const countryName = usePlanningCountryName(planner.country)

  const { load } = planner
  const loadContext = useCallback(async (): Promise<TaskPlanContext | null> => load(task), [load, task])
  const { data: context, error: loadError, isLoading } = useAsyncResource(loadContext, null)

  const result = useMemo(
    () => (context ? planner.plan(context, task.dueDate === null ? 'early' : distribution) : null),
    [context, planner, distribution, task.dueDate],
  )
  const earliest = useMemo(
    () => (context && result && result.missingMinutes > 0 ? findEarliestCompletion(context.request) : null),
    [context, result],
  )

  const create = useAsyncAction(async (blocks: readonly PlannedBlock[]) => {
    if (!context) return
    await planner.apply(task, context, blocks)
    onPlanned()
    onClose()
  })
  const reschedule = useAsyncAction(async (dueDate: string) => {
    if (!onReschedule) return
    const updated = await onReschedule(task, dueDate)
    setTask(updated)
    onTaskChange(updated)
  })
  const isBusy = create.isPending || reschedule.isPending

  const left = context?.request.effortMinutes ?? 0
  const blocks = result?.blocks ?? []
  const missing = result?.missingMinutes ?? 0
  const replaced = context?.replacedBlocks.length ?? 0

  const facts = [
    text.effort(format.effort(context?.effortMinutes ?? task.estimateMinutes ?? 0)),
    context && context.doneMinutes > 0 && text.done(format.effort(context.doneMinutes)),
    context && context.doneMinutes > 0 && left > 0 && text.left(format.effort(left)),
    task.dueDate && text.due(format.fullDay(task.dueDate)),
  ].filter((fact): fact is string => Boolean(fact))

  return (
    <Modal title={text.title} onClose={onClose}>
      <div className="taskPlan">
        <p className="taskPlanTask">{task.title}</p>
        <p className="formHint">{facts.join(' · ')}</p>
        {task.dueDate ? (
          <SegmentedField
            label={m.settings.planning.distribution}
            value={distribution}
            options={PLANNING_DISTRIBUTIONS.map((value) => ({
              value,
              label: m.settings.planning.distributions[value],
            }))}
            onChange={setDistribution}
          />
        ) : (
          <p className="formHint">{text.noDue}</p>
        )}
        <p className="formHint">{text.rules(countryName)}</p>
        {context?.isCapped && <p className="formHint">{text.capped}</p>}
        {isLoading && !context && <p className="formHint">{text.loading}</p>}
        <ErrorMessage message={loadError} />
        {context && left === 0 && <p className="eventNotice">{text.nothingLeft}</p>}
        {blocks.length > 0 && (
          <section className="taskPlanBlocks" aria-label={text.blocks}>
            <h3 className="formSubtitle">{text.blocks}</h3>
            <ul className="taskPlanDays">
              {groupByDate(blocks).map(([date, dayBlocks]) => (
                <li key={date} className="taskPlanDay">
                  <span className="taskPlanDate">{format.longDate(date)}</span>
                  <ul className="taskPlanTimes">
                    {dayBlocks.map((block) => (
                      <li key={block.start}>
                        {text.block(
                          format.time(timeToMinutes(block.start)),
                          format.time(timeToMinutes(block.end)),
                          format.effort(block.minutes),
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        )}
        {replaced > 0 && <p className="formHint">{text.replaces(replaced)}</p>}
        {missing > 0 && (
          <div className="overlapNotice taskPlanMissing" role="status">
            <p>{blocks.length > 0 ? text.missing(format.effort(missing)) : text.nothingFits}</p>
            <p>{earliest ? text.adjust : `${text.noLaterDate} ${text.adjust}`}</p>
          </div>
        )}
        <ErrorMessage message={create.error ?? reschedule.error} />
        <div className="modalActions">
          {missing === 0 && blocks.length > 0 && (
            <Button isPending={create.isPending} pendingLabel={text.creating} onClick={() => void create.run(blocks)}>
              {text.create}
            </Button>
          )}
          {context && left === 0 && replaced > 0 && (
            <Button isPending={create.isPending} pendingLabel={text.creating} onClick={() => void create.run([])}>
              {text.removeFuture}
            </Button>
          )}
          {missing > 0 && earliest && onReschedule && (
            <Button
              isPending={reschedule.isPending}
              disabled={create.isPending}
              onClick={() => void reschedule.run(earliest)}
            >
              {text.moveDue(format.fullDay(earliest))}
            </Button>
          )}
          {missing > 0 && blocks.length > 0 && (
            <Button
              variant="secondary"
              isPending={create.isPending}
              pendingLabel={text.creating}
              disabled={reschedule.isPending}
              onClick={() => void create.run(blocks)}
            >
              {text.createPartial}
            </Button>
          )}
          <Button variant="secondary" disabled={isBusy} onClick={onClose}>
            {m.common.cancel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
