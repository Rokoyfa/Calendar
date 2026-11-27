import type { CSSProperties } from 'react'
import { MoreButton } from '../../../components/MoreButton.tsx'
import { useI18n } from '../../../i18n/index.ts'
import { classNames } from '../../../utils/classNames.ts'
import { timeToMinutes } from '../../../utils/date.ts'
import { withoutPropagation } from '../../../utils/dom.ts'
import { useDayTasks, useTasksContext } from '../context/TasksContext.ts'
import type { Task } from '../types/task.ts'
import { isTaskDone, isTaskOverdue } from '../utils/task.ts'
import { TaskCheckbox } from './TaskCheckbox.tsx'

type TaskChipProps = {
  task: Task
  style?: CSSProperties
}

export function TaskChip({ task, style }: TaskChipProps) {
  const { format } = useI18n()
  const context = useTasksContext()
  if (!context) return null
  return (
    <div
      className={classNames(
        'taskChip',
        isTaskDone(task) && 'isDone',
        `taskChip--${task.status}`,
        `taskChip--${task.priority}`,
        isTaskOverdue(task, context.today) && 'isOverdue',
      )}
      style={style}
      data-task-id={task.id}
      onClick={(event) => event.stopPropagation()}
    >
      <TaskCheckbox task={task} />
      <button type="button" className="taskChipTitle" onClick={withoutPropagation(() => context.open(task))}>
        {task.dueTime && <span className="eventChipTime">{format.time(timeToMinutes(task.dueTime))}</span>}
        {task.title}
      </button>
    </div>
  )
}

type DayTasksProps = {
  date: string
  limit?: number
  rowOffset?: number
  onMore?: () => void
}

export function DayTasks({ date, limit = Number.POSITIVE_INFINITY, rowOffset, onMore }: DayTasksProps) {
  const { m } = useI18n()
  const tasks = useDayTasks(date)
  if (tasks.length === 0) return null
  const visible = tasks.length > limit ? tasks.slice(0, Math.max(limit - 1, 0)) : tasks
  const moreCount = tasks.length - visible.length
  const rowStyle = (index: number): CSSProperties | undefined =>
    rowOffset === undefined ? undefined : { gridRow: rowOffset + index + 1 }
  return (
    <>
      {visible.map((task, index) => (
        <TaskChip key={task.id} task={task} style={rowStyle(index)} />
      ))}
      {moreCount > 0 && (
        <MoreButton
          className="taskMore"
          style={rowStyle(visible.length)}
          onClick={withoutPropagation(() => onMore?.())}
        >
          {visible.length === 0 ? m.tasks.count(moreCount) : m.tasks.more(moreCount)}
        </MoreButton>
      )}
    </>
  )
}
