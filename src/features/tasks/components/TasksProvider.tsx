import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getErrorMessage, useI18n } from '../../../i18n/index.ts'
import type { DateRange } from '../../../utils/date.ts'
import { useStorage } from '../../storage/index.ts'
import { TasksContext, type TasksContextValue } from '../context/TasksContext.ts'
import { useTaskActions, useTaskList } from '../hooks/useTasks.ts'
import type { TaskEditor } from '../hooks/useTaskEditor.ts'
import type { Task, TaskRepository, TaskSetup } from '../types/task.ts'
import { EMPTY_TASK_INPUT, groupTasksByDate, isTaskDone } from '../utils/task.ts'

const TaskModal = lazy(async () => ({ default: (await import('./TaskModal.tsx')).TaskModal }))

type PendingToggle = { completedAt: string | null; version: number }

type TasksProviderProps = {
  setup: TaskSetup | undefined
  range: DateRange
  today: string
  includeList: boolean
  editor: TaskEditor
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

function ActiveTasksProvider({
  setup,
  repository,
  range,
  today,
  includeList,
  editor,
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
  const [pending, setPending] = useState<ReadonlyMap<string, PendingToggle>>(new Map())
  const isUnsupported = ranged.isUnsupported || full.isUnsupported

  useEffect(() => {
    if (isUnsupported) onUnsupported()
  }, [isUnsupported, onUnsupported])

  const withPending = useCallback(
    (tasks: readonly Task[]) =>
      pending.size === 0
        ? tasks
        : tasks.map((task) => {
            const toggle = pending.get(task.id)
            return toggle && toggle.version === task.version ? { ...task, completedAt: toggle.completedAt } : task
          }),
    [pending],
  )
  const rangedTasks = useMemo(() => withPending(ranged.tasks), [withPending, ranged.tasks])
  const listTasks = useMemo(() => withPending(full.tasks), [withPending, full.tasks])
  const byDate = useMemo(() => groupTasksByDate(rangedTasks), [rangedTasks])

  const creatableIn = choices.filter((choice) => access.canCreateIn(choice.id))
  const defaultCalendarId = access.canCreateIn(targetCalendarId) ? targetCalendarId : (creatableIn[0]?.id ?? null)

  const toggle = useCallback(
    (task: Task) => {
      if (!access.canComplete(task)) return
      const completed = !isTaskDone(task)
      const forget = () =>
        setPending((current) => {
          const next = new Map(current)
          next.delete(task.id)
          return next
        })
      setPending((current) =>
        new Map(current).set(task.id, {
          completedAt: completed ? new Date().toISOString() : null,
          version: task.version,
        }),
      )
      onError(null)
      actions.setCompleted(task, completed).catch((error: unknown) => {
        forget()
        onError(getErrorMessage(error, m))
      })
    },
    [access, actions, onError, m],
  )

  const { openCreate, openEdit } = editor
  const value = useMemo<TasksContextValue>(
    () => ({
      byDate,
      list: listTasks,
      listError: full.error ?? ranged.error,
      isListLoading: full.isLoading,
      today,
      calendarNames: calendarIds.length > 1 ? calendarNames : null,
      canCreate: defaultCalendarId !== null,
      canComplete: access.canComplete,
      toggle,
      open: openEdit,
      create: (draft = {}) => {
        if (defaultCalendarId !== null) openCreate(draft)
      },
      quickAdd: async (title: string) => {
        if (defaultCalendarId !== null) await actions.create(defaultCalendarId, { ...EMPTY_TASK_INPUT, title })
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
      defaultCalendarId,
      access.canComplete,
      toggle,
      openEdit,
      openCreate,
      actions,
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
            access={access}
            loadAssignees={loadAssignees}
            onSave={async (input, calendarId) => {
              if (shownTask) await actions.save(shownTask, input, calendarId)
              else await actions.create(calendarId, input)
              editor.close()
            }}
            onToggle={async (task) => {
              await actions.setCompleted(task, !isTaskDone(task))
              editor.close()
            }}
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
