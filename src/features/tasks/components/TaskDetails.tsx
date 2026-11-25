import { useI18n } from '../../../i18n/index.ts'
import { classNames } from '../../../utils/classNames.ts'
import { timeToMinutes } from '../../../utils/date.ts'
import type { TasksContextValue } from '../context/TasksContext.ts'
import type { Task } from '../types/task.ts'
import { checklistProgress, isTaskOverdue } from '../utils/task.ts'

type TaskDetailsProps = {
  task: Task
  context: TasksContextValue
}

export function TaskDetails({ task, context }: TaskDetailsProps) {
  const { m, format } = useI18n()
  const text = m.tasks
  const isOverdue = isTaskOverdue(task, context.today)
  const due = task.dueDate
    ? [format.fullDay(task.dueDate), task.dueTime ? format.time(timeToMinutes(task.dueTime)) : null]
        .filter(Boolean)
        .join(', ')
    : null
  const progress = checklistProgress(task)
  const calendarName = context.calendarNames?.get(task.calendarId)
  const categories = task.categoryIds.flatMap((id) => context.categories.get(id) ?? [])
  return (
    <span className="taskDetails">
      {task.priority !== 'normal' && (
        <span className={`taskBadge taskPriority taskPriority--${task.priority}`}>
          {text.priorities[task.priority]}
        </span>
      )}
      {due && (
        <span className={classNames('taskBadge', isOverdue && 'isOverdue')}>
          {isOverdue ? `${text.overdue}: ${due}` : text.due(due)}
        </span>
      )}
      {task.estimateMinutes !== null && (
        <span className="taskBadge">{text.effort(format.effort(task.estimateMinutes))}</span>
      )}
      {progress.total > 0 && <span className="taskBadge">{text.checklistProgress(progress.done, progress.total)}</span>}
      {task.assignee && <span className="taskBadge">{text.assignedTo(task.assignee.name)}</span>}
      {categories.map((category) => (
        <span key={category.id} className="taskBadge taskCategory">
          {category.name}
        </span>
      ))}
      {calendarName && <span className="taskBadge taskCalendar">{calendarName}</span>}
    </span>
  )
}
