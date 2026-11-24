import { CheckIcon } from '../../../components/Icons.tsx'
import { useI18n } from '../../../i18n/index.ts'
import { classNames } from '../../../utils/classNames.ts'
import { withoutPropagation } from '../../../utils/dom.ts'
import { useTasksContext } from '../context/TasksContext.ts'
import type { Task } from '../types/task.ts'
import { isTaskDone } from '../utils/task.ts'

export function TaskCheckbox({ task }: { task: Task }) {
  const { m } = useI18n()
  const context = useTasksContext()
  if (!context) return null
  const isDone = isTaskDone(task)
  return (
    <button
      type="button"
      role="checkbox"
      className={classNames('taskCheck', isDone && 'isChecked')}
      aria-checked={isDone}
      aria-label={m.tasks.toggle(task.title)}
      title={isDone ? m.tasks.markOpen : m.tasks.markDone}
      disabled={!context.canComplete(task)}
      onClick={withoutPropagation(() => context.toggle(task))}
    >
      {isDone && <CheckIcon size={12} />}
    </button>
  )
}
