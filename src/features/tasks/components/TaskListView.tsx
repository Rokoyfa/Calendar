import { useState, type SubmitEventHandler } from 'react'
import { Button } from '../../../components/Button.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useI18n } from '../../../i18n/index.ts'
import { classNames } from '../../../utils/classNames.ts'
import { timeToMinutes } from '../../../utils/date.ts'
import { useTasksContext, type TasksContextValue } from '../context/TasksContext.ts'
import type { Task } from '../types/task.ts'
import {
  groupTasks,
  isTaskDone,
  sumTaskEstimates,
  TASK_GROUPS,
  TASK_TITLE_MAX_LENGTH,
  type TaskGroup,
} from '../utils/task.ts'
import { TaskCheckbox } from './TaskCheckbox.tsx'

type TaskRowProps = {
  task: Task
  group: TaskGroup
  context: TasksContextValue
}

function TaskRow({ task, group, context }: TaskRowProps) {
  const { m, format } = useI18n()
  const text = m.tasks
  const calendarName = context.calendarNames?.get(task.calendarId)
  const due = task.dueDate
    ? [format.longDate(task.dueDate), task.dueTime ? format.time(timeToMinutes(task.dueTime)) : null]
        .filter(Boolean)
        .join(', ')
    : null
  const details = [
    group === 'today' ? (task.dueTime ? format.time(timeToMinutes(task.dueTime)) : null) : due && text.due(due),
    task.estimateMinutes !== null && text.effort(format.effort(task.estimateMinutes)),
    task.assignee && text.assignedTo(task.assignee.name),
    calendarName,
  ].filter(Boolean)
  return (
    <li className={classNames('taskRow', isTaskDone(task) && 'isDone', group === 'overdue' && 'isOverdue')}>
      <TaskCheckbox task={task} />
      <button type="button" className="taskRowOpen" data-task-id={task.id} onClick={() => context.open(task)}>
        <span className="taskRowTitle">{task.title}</span>
        {details.length > 0 && <span className="taskRowDetails">{details.join(' · ')}</span>}
      </button>
    </li>
  )
}

function QuickAdd({ onAdd }: { onAdd: (title: string) => Promise<void> }) {
  const { m } = useI18n()
  const [title, setTitle] = useState('')
  const { run, isPending, error } = useAsyncAction(async (value: string) => {
    await onAdd(value)
    setTitle('')
  })
  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    const value = title.trim()
    if (value) void run(value)
  }
  return (
    <form className="taskQuickAdd" onSubmit={handleSubmit}>
      <input
        className="input"
        name="quickAdd"
        aria-label={m.tasks.quickAdd}
        placeholder={m.tasks.quickAddPlaceholder}
        maxLength={TASK_TITLE_MAX_LENGTH}
        autoComplete="off"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <Button type="submit" variant="outline" isPending={isPending} disabled={!title.trim()}>
        {m.tasks.add}
      </Button>
      <ErrorMessage message={error} />
    </form>
  )
}

export function TaskListView() {
  const { m, format } = useI18n()
  const context = useTasksContext()
  const [showsDone, setShowsDone] = useState(false)
  if (!context) return null
  const text = m.tasks
  const groups = groupTasks(context.list, context.today)
  const doneCount = groups.get('done')?.length ?? 0
  const openCount = context.list.length - doneCount
  const shown = TASK_GROUPS.filter((group) => (group === 'done' ? showsDone : true))

  return (
    <div className="taskListView">
      {context.canCreate && <QuickAdd onAdd={context.quickAdd} />}
      <ErrorMessage message={context.listError} />
      {openCount === 0 && !context.isListLoading && !context.listError && <p className="agendaEmpty">{text.empty}</p>}
      {shown.map((group) => {
        const tasks = groups.get(group) ?? []
        if (tasks.length === 0) return null
        const effort = group === 'done' ? 0 : sumTaskEstimates(tasks)
        return (
          <section key={group} className={classNames('taskGroup', `taskGroup--${group}`)}>
            <h3 className="taskGroupTitle">
              {text.groups[group]}
              <span className="taskGroupCount">{tasks.length}</span>
              {effort > 0 && (
                <span className="taskGroupEffort" title={text.estimate}>
                  <span className="visuallyHidden">{text.estimate}: </span>
                  {format.effort(effort)}
                </span>
              )}
            </h3>
            <ul className="taskList">
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} group={group} context={context} />
              ))}
            </ul>
          </section>
        )
      })}
      {doneCount > 0 && (
        <button type="button" className="linkButton taskDoneToggle" onClick={() => setShowsDone((value) => !value)}>
          {showsDone ? text.hideDone : text.showDone(doneCount)}
        </button>
      )}
    </div>
  )
}
