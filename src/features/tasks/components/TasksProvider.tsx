import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getErrorMessage, useI18n } from '../../../i18n/index.ts'
import type { Category } from '../../../utils/category.ts'
import type { DateRange } from '../../../utils/date.ts'
import { useStorage } from '../../storage/index.ts'
import { TasksContext, type TasksContextValue } from '../context/TasksContext.ts'
import { useTaskActions, useTaskList } from '../hooks/useTasks.ts'
import type { TaskEditor } from '../hooks/useTaskEditor.ts'
import type { Task, TaskRepository, TaskSetup, TaskStatus } from '../types/task.ts'
import { groupTasksByDate, isTaskDone } from '../utils/task.ts'

const TaskModal = lazy(async () => ({ default: (await import('./TaskModal.tsx')).TaskModal }))

type PendingStatus = { status: TaskStatus; version: number }

const NO_CATEGORIES: readonly Category[] = []

type TasksProviderProps = {
  setup: TaskSetup | undefined
  range: DateRange
  today: string
  includeList: boolean
  editor: TaskEditor
  categories?: readonly Category[]
  onCreateCategory?: (calendarId: string, name: string) => Promise<Category>
  onSwitchToEvent?: (draft: { title: string; date: string | null }) => void
  onUnsupported: () => void
  onError: (message: string | null) => void
  children: ReactNode
}

export function TasksProvider({ setup, children, ...options }: TasksProviderProps) {
  const { tasks: repository } = useStorage()
  if (!setup || !repository) return <TasksContext value={null}>{children}</TasksContext>
  return (
    <ActiveTasksProvider setup={setup} repository={repository} {...options}>
      {children}
    </ActiveTasksProvider>
  )
}

type ActiveTasksProviderProps = Omit<TasksProviderProps, 'setup'> & {
  setup: TaskSetup
  repository: TaskRepository
}

const withStatus = (task: Task, status: TaskStatus): Task => ({
  ...task,
  status,
  completedAt: status === 'done' ? (task.completedAt ?? new Date().toISOString()) : null,
})

function ActiveTasksProvider({
  setup,
  repository,
  range,
  today,
  includeList,
  editor,
  categories = NO_CATEGORIES,
  onCreateCategory,
  onSwitchToEvent,
  onUnsupported,
  onError,
  children,
}: ActiveTasksProviderProps) {
  const { m } = useI18n()
  const { calendarIds, targetCalendarId, choices, calendarNames, access, loadAssignees, openTaskId, onOpenTaskDone } =
    setup
  const ranged = useTaskList(repository, { calendarIds, from: range.from, to: range.to })
  const full = useTaskList(repository, { calendarIds, enabled: includeList || Boolean(openTaskId) })
  const actions = useTaskActions(repository)
  const [pending, setPending] = useState<ReadonlyMap<string, PendingStatus>>(new Map())
  const isUnsupported = ranged.isUnsupported || full.isUnsupported

  useEffect(() => {
    if (isUnsupported) onUnsupported()
  }, [isUnsupported, onUnsupported])

  const withPending = useCallback(
    (tasks: readonly Task[]) =>
      pending.size === 0
        ? tasks
        : tasks.map((task) => {
            const change = pending.get(task.id)
            return change && change.version === task.version ? withStatus(task, change.status) : task
          }),
    [pending],
  )
  const rangedTasks = useMemo(() => withPending(ranged.tasks), [withPending, ranged.tasks])
  const listTasks = useMemo(() => withPending(full.tasks), [withPending, full.tasks])
  const byDate = useMemo(() => groupTasksByDate(rangedTasks), [rangedTasks])
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories])

  const creatableIn = choices.filter((choice) => access.canCreateIn(choice.id))
  const defaultCalendarId = access.canCreateIn(targetCalendarId) ? targetCalendarId : (creatableIn[0]?.id ?? null)

  const changeStatus = useCallback(
    (task: Task, status: TaskStatus) => {
      if (!access.canProgress(task) || task.status === status) return
      const forget = () =>
        setPending((current) => {
          const next = new Map(current)
          next.delete(task.id)
          return next
        })
      setPending((current) => new Map(current).set(task.id, { status, version: task.version }))
      onError(null)
      actions.setStatus(task, status).catch((error: unknown) => {
        forget()
        onError(getErrorMessage(error, m))
      })
    },
    [access, actions, onError, m],
  )

  const toggle = useCallback((task: Task) => changeStatus(task, isTaskDone(task) ? 'open' : 'done'), [changeStatus])

  const { openCreate, openEdit } = editor
  const value = useMemo<TasksContextValue>(
    () => ({
      byDate,
      list: listTasks,
      listError: full.error ?? ranged.error,
      isListLoading: full.isLoading,
      today,
      calendarNames: calendarIds.length > 1 ? calendarNames : null,
      categories: categoryById,
      canCreate: defaultCalendarId !== null,
      canProgress: access.canProgress,
      toggle,
      changeStatus,
      open: openEdit,
      create: (draft = {}) => {
        if (defaultCalendarId !== null) openCreate(draft)
      },
    }),
    [
      byDate,
      listTasks,
      full.error,
      full.isLoading,
      ranged.error,
      today,
      calendarIds.length,
      calendarNames,
      categoryById,
      defaultCalendarId,
      access.canProgress,
      toggle,
      changeStatus,
      openEdit,
      openCreate,
    ],
  )

  useEffect(() => {
    if (!openTaskId || full.isLoading) return
    const linked = full.tasks.find((task) => task.id === openTaskId)
    if (linked) openEdit(linked)
    onOpenTaskDone?.()
  }, [openTaskId, full.isLoading, full.tasks, openEdit, onOpenTaskDone])

  const shown = editor.shown
  const shownTask = shown?.task ?? null

  return (
    <TasksContext value={value}>
      {children}
      {shown && (shownTask || defaultCalendarId) && (
        <Suspense fallback={null}>
          <TaskModal
            key={shownTask?.id ?? 'new'}
            task={shownTask}
            draft={shown.draft}
            defaultCalendarId={
              shown.draft.calendarId && access.canCreateIn(shown.draft.calendarId)
                ? shown.draft.calendarId
                : (defaultCalendarId ?? '')
            }
            choices={creatableIn}
            calendarNames={calendarNames}
            categories={categories}
            access={access}
            loadAssignees={loadAssignees}
            onCreateCategory={onCreateCategory}
            onSave={async (input, calendarId) => {
              if (shownTask) await actions.save(shownTask, input, calendarId)
              else await actions.create(calendarId, input)
              editor.close()
            }}
            onStatus={actions.setStatus}
            onChecklistItem={actions.setChecklistItem}
            onDelete={async (task) => {
              await actions.remove(task)
              editor.close()
            }}
            onSwitchToEvent={onSwitchToEvent}
            onClose={editor.close}
          />
        </Suspense>
      )}
    </TasksContext>
  )
}
