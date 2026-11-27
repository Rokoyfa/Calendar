import { useState, type DragEvent } from 'react'
import { Button } from '../../../components/Button.tsx'
import { PlusIcon } from '../../../components/Icons.tsx'
import { SegmentedControl } from '../../../components/SegmentedControl.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { useI18n } from '../../../i18n/index.ts'
import { classNames } from '../../../utils/classNames.ts'
import { useTasksContext, type TasksContextValue } from '../context/TasksContext.ts'
import { TASK_LAYOUTS, useTaskLayout } from '../hooks/useTaskLayout.ts'
import { TASK_STATUSES, type Task, type TaskStatus } from '../types/task.ts'
import { groupTasksByStatus, isTaskDone, isTaskOverdue, sumTaskEstimates } from '../utils/task.ts'
import { TaskCheckbox } from './TaskCheckbox.tsx'
import { TaskDetails } from './TaskDetails.tsx'
import { TextButton } from '../../../components/TextButton.tsx'

const TASK_MIME = 'application/x-calendar-task'

type TaskItemProps = {
  task: Task
  context: TasksContextValue
}

function TaskOpenButton({ task, context }: TaskItemProps) {
  return (
    <button type="button" className="taskOpen" data-task-id={task.id} onClick={() => context.open(task)}>
      <span className="taskTitle">{task.title}</span>
      <TaskDetails task={task} context={context} />
    </button>
  )
}

const itemClassName = (base: string, task: Task, today: string) =>
  classNames(base, isTaskDone(task) && 'isDone', isTaskOverdue(task, today) && 'isOverdue', `${base}--${task.priority}`)

function StatusHeading({ status, tasks }: { status: TaskStatus; tasks: readonly Task[] }) {
  const { m, format } = useI18n()
  const text = m.tasks
  const effort = status === 'done' ? 0 : sumTaskEstimates(tasks)
  return (
    <h3 className="taskGroupTitle">
      <span className={`taskStatusDot taskStatusDot--${status}`} aria-hidden="true" />
      {text.statuses[status]}
      <span className="taskGroupCount">{tasks.length}</span>
      {effort > 0 && (
        <span className="taskGroupEffort" title={text.estimate}>
          <span className="visuallyHidden">{text.estimate}: </span>
          {format.effort(effort)}
        </span>
      )}
    </h3>
  )
}

function TaskList({ context }: { context: TasksContextValue }) {
  const { m } = useI18n()
  const [showsDone, setShowsDone] = useState(false)
  const groups = groupTasksByStatus(context.list)
  const doneCount = groups.get('done')?.length ?? 0
  return (
    <div className="taskList">
      {TASK_STATUSES.map((status) => {
        const tasks = groups.get(status) ?? []
        if (tasks.length === 0 || (status === 'done' && !showsDone)) return null
        return (
          <section key={status} className={classNames('taskGroup', `taskGroup--${status}`)}>
            <StatusHeading status={status} tasks={tasks} />
            <ul className="taskRows">
              {tasks.map((task) => (
                <li key={task.id} className={itemClassName('taskRow', task, context.today)}>
                  <TaskCheckbox task={task} />
                  <TaskOpenButton task={task} context={context} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
      {doneCount > 0 && (
        <TextButton className="taskDoneToggle" onClick={() => setShowsDone((value) => !value)}>
          {showsDone ? m.tasks.hideDone : m.tasks.showDone(doneCount)}
        </TextButton>
      )}
    </div>
  )
}

function TaskBoard({ context }: { context: TasksContextValue }) {
  const { m } = useI18n()
  const [dragged, setDragged] = useState<Task | null>(null)
  const [target, setTarget] = useState<TaskStatus | null>(null)
  const groups = groupTasksByStatus(context.list)

  const startDrag = (task: Task) => (event: DragEvent<HTMLElement>) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(TASK_MIME, task.id)
    event.dataTransfer.setData('text/plain', task.title)
    setDragged(task)
  }

  const endDrag = () => {
    setDragged(null)
    setTarget(null)
  }

  const canDropOn = (status: TaskStatus) => dragged !== null && dragged.status !== status

  const dragOver = (status: TaskStatus) => (event: DragEvent<HTMLElement>) => {
    if (!canDropOn(status)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setTarget(status)
  }

  const drop = (status: TaskStatus) => (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    if (dragged && canDropOn(status)) context.changeStatus(dragged, status)
    endDrag()
  }

  return (
    <div className="taskBoard">
      {TASK_STATUSES.map((status) => {
        const tasks = groups.get(status) ?? []
        return (
          <section
            key={status}
            className={classNames('taskColumn', `taskColumn--${status}`, target === status && 'isDropTarget')}
            data-status={status}
            onDragOver={dragOver(status)}
            onDragLeave={() => setTarget((current) => (current === status ? null : current))}
            onDrop={drop(status)}
          >
            <StatusHeading status={status} tasks={tasks} />
            {tasks.length === 0 ? (
              <p className="taskColumnEmpty">{m.tasks.columnEmpty}</p>
            ) : (
              <ul className="taskCards">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className={classNames(
                      itemClassName('taskCard', task, context.today),
                      dragged?.id === task.id && 'isDragging',
                    )}
                    draggable={context.canProgress(task)}
                    onDragStart={startDrag(task)}
                    onDragEnd={endDrag}
                  >
                    <TaskCheckbox task={task} />
                    <TaskOpenButton task={task} context={context} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}

export function TasksView() {
  const { m } = useI18n()
  const context = useTasksContext()
  const [layout, setLayout] = useTaskLayout()
  if (!context) return null
  const text = m.tasks
  const isEmpty = context.list.length === 0 && !context.isListLoading && !context.listError
  return (
    <div className={classNames('tasksView', `tasksView--${layout}`)}>
      <div className="tasksToolbar">
        <SegmentedControl
          label={text.layout.label}
          value={layout}
          options={TASK_LAYOUTS.map((value) => ({ value, label: text.layout[value] }))}
          onChange={setLayout}
        />
        {context.canCreate && (
          <Button className="tasksCreate" onClick={() => context.create()}>
            <PlusIcon size={16} />
            {text.create}
          </Button>
        )}
      </div>
      <ErrorMessage message={context.listError} />
      {isEmpty && <p className="agendaEmpty">{text.empty}</p>}
      {!isEmpty && (layout === 'board' ? <TaskBoard context={context} /> : <TaskList context={context} />)}
    </div>
  )
}
