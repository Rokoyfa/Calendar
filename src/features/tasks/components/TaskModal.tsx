import type { PlanningDistribution } from '../../../domain/preferences.ts'
import { lazy, Suspense, useCallback, useMemo, useState, type SubmitEventHandler } from 'react'
import { Button } from '../../../components/Button.tsx'
import { ConfirmModal } from '../../../components/ConfirmModal.tsx'
import { Form } from '../../../components/Form.tsx'
import { FormField } from '../../../components/FormField.tsx'
import { Modal } from '../../../components/Modal.tsx'
import { SegmentedControl } from '../../../components/SegmentedControl.tsx'
import { SelectField } from '../../../components/SelectField.tsx'
import { Tabs, type TabDefinition } from '../../../components/Tabs.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import { useI18n } from '../../../i18n/index.ts'
import type { Category } from '../../../domain/category.ts'
import { CategoryField } from '../../categories/index.ts'
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskAccess,
  type TaskCalendarChoice,
  type TaskDraft,
  type TaskInput,
  type TaskPerson,
  type TaskPlanningSetup,
  type TaskPlanPreview,
  type TaskStatus,
} from '../types/task.ts'
import {
  EMPTY_TASK_INPUT,
  isTaskDone,
  normalizeTaskInput,
  TASK_NOTES_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
  toTaskInput,
} from '../utils/task.ts'
import { useHasFutureBlocks } from '../hooks/useHasFutureBlocks.ts'
import { ChecklistField } from './ChecklistField.tsx'
import { Locked } from './Locked.tsx'
import { TaskDueFields } from './TaskDueFields.tsx'
import { TaskEstimateField } from './TaskEstimateField.tsx'
import {
  toEstimateMinutes,
  toEstimateParts,
  validateTaskInput,
  type EstimateParts,
  type TaskErrors,
} from '../utils/taskForm.ts'

const TaskPlanModal = lazy(async () => ({ default: (await import('./TaskPlanModal.tsx')).TaskPlanModal }))

type TaskTab = 'general' | 'checklist' | 'details'

const NOBODY = ''
const NO_PEOPLE: TaskPerson[] = []

export type TaskModalProps = {
  task: Task | null
  draft: TaskDraft
  defaultCalendarId: string
  choices: readonly TaskCalendarChoice[]
  calendarNames: ReadonlyMap<string, string>
  categories: readonly Category[]
  access: TaskAccess
  loadAssignees?: (calendarId: string) => Promise<TaskPerson[]>
  onCreateCategory?: (calendarId: string, name: string) => Promise<Category>
  onSave: (input: TaskInput, calendarId: string) => Promise<void>
  onStatus: (task: Task, status: TaskStatus) => Promise<Task>
  onChecklistItem: (task: Task, itemId: string, done: boolean) => Promise<Task>
  onDelete: (task: Task) => Promise<void>
  onSwitchToEvent?: (draft: { title: string; date: string | null }) => void
  planning?: TaskPlanningSetup
  onReschedule?: (task: Task, dueDate: string) => Promise<Task>
  resumePlan?: PlanningDistribution
  onPlanPreview?: (preview: TaskPlanPreview) => void
  onClose: () => void
}

const initialInput = (task: Task | null, draft: TaskDraft): TaskInput =>
  task ? toTaskInput(task) : { ...EMPTY_TASK_INPUT, ...draft }

const withCurrent = (choices: readonly TaskCalendarChoice[], current: TaskCalendarChoice | null) =>
  current && !choices.some((choice) => choice.id === current.id) ? [current, ...choices] : choices

export function TaskModal({
  task: initialTask,
  draft,
  defaultCalendarId,
  choices,
  calendarNames,
  categories,
  access,
  loadAssignees,
  onCreateCategory,
  onSave,
  onStatus,
  onChecklistItem,
  onDelete,
  onSwitchToEvent,
  planning,
  onReschedule,
  resumePlan,
  onPlanPreview,
  onClose,
}: TaskModalProps) {
  const { m, format } = useI18n()
  const text = m.tasks
  const [task, setTask] = useState(initialTask)
  const isEditable = task === null || access.canEdit(task)
  const canProgress = task === null || isEditable || access.canProgress(task)
  const [values, setValues] = useState(() => initialInput(initialTask, draft))
  const [calendarId, setCalendarId] = useState(() => task?.calendarId ?? draft.calendarId ?? defaultCalendarId)
  const [estimate, setEstimate] = useState(() =>
    toEstimateParts(initialTask?.estimateMinutes ?? draft.estimateMinutes ?? null),
  )
  const [errors, setErrors] = useState<TaskErrors>({})
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TaskTab>('general')
  const [isPlanOpen, setIsPlanOpen] = useState(resumePlan !== undefined)
  const [hasPlanned, setHasPlanned] = useState(false)
  const hasFutureBlocks = useHasFutureBlocks(planning ? initialTask : null, planning)

  const loadPeople = useCallback(
    async () => (loadAssignees ? loadAssignees(calendarId) : NO_PEOPLE),
    [loadAssignees, calendarId],
  )
  const { data: people } = useAsyncResource(loadPeople, NO_PEOPLE)
  const assigneeOptions = useMemo(() => {
    const known = task?.assignee && !people.some(({ id }) => id === task.assignee?.id) ? [task.assignee] : []
    return [...known, ...people]
  }, [people, task])
  const calendarCategories = useMemo(
    () => categories.filter((category) => category.calendarId === calendarId),
    [categories, calendarId],
  )

  const calendarOptions = withCurrent(
    choices,
    task ? { id: task.calendarId, name: calendarNames.get(task.calendarId) ?? '' } : null,
  )
  const canChooseCalendar = isEditable && calendarOptions.length > 1 && (task === null || access.canDelete(task))

  const {
    run: save,
    isPending,
    error: saveError,
  } = useAsyncAction(async (input: TaskInput) => {
    await onSave(input, calendarId)
  })
  const progress = useAsyncAction(async (change: (current: Task) => Promise<Task>) => {
    if (!task) return
    try {
      const updated = await change(task)
      setTask(updated)
      setValues(toTaskInput(updated))
    } catch (error) {
      setValues(toTaskInput(task))
      throw error
    }
  })

  const update = (changes: Partial<TaskInput>) => {
    setValues((current) => ({ ...current, ...changes }))
    setErrors((current) => ({ ...current, ...Object.fromEntries(Object.keys(changes).map((key) => [key, undefined])) }))
  }

  const changeCalendar = (next: string) => {
    setCalendarId(next)
    update({ assigneeId: null, categoryIds: [] })
  }

  const changeStatus = (status: TaskStatus) => {
    update({ status })
    if (!isEditable) void progress.run((current) => onStatus(current, status))
  }

  const toggleChecklistItem = (index: number, done: boolean) => {
    const itemId = task?.checklist[index]?.id
    if (!itemId) return
    setValues((current) => ({
      ...current,
      checklist: current.checklist.map((item, position) => (position === index ? { ...item, done } : item)),
    }))
    void progress.run((current) => onChecklistItem(current, itemId, done))
  }

  const changeEstimate = (changes: Partial<EstimateParts>) => {
    setEstimate((current) => ({ ...current, ...changes }))
    setErrors((current) => ({ ...current, estimate: undefined }))
  }

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    if (!isEditable) return
    const estimateMinutes = toEstimateMinutes(estimate)
    const input = normalizeTaskInput({ ...values, estimateMinutes: estimateMinutes ?? null })
    const found = validateTaskInput(input, estimateMinutes, m)
    setErrors(found)
    if (Object.values(found).some(Boolean)) {
      const invalid: Record<TaskTab, boolean> = {
        general: Boolean(found.title || found.dueDate || found.dueTime || found.estimate || found.recurrence),
        checklist: false,
        details: Boolean(found.notes),
      }
      if (!invalid[activeTab]) setActiveTab(invalid.general ? 'general' : 'details')
      return
    }
    void save(input)
  }

  const canPlan = planning !== undefined && task !== null && !isTaskDone(task) && canProgress
  const hasUnsavedPlanChanges =
    task !== null &&
    (values.dueDate !== task.dueDate ||
      values.dueTime !== task.dueTime ||
      toEstimateMinutes(estimate) !== task.estimateMinutes)

  const planHint =
    toEstimateMinutes(estimate) === null
      ? text.plan.needsEstimate
      : hasUnsavedPlanChanges
        ? text.plan.saveFirst
        : undefined

  const takeRescheduled = (updated: Task) => {
    setTask(updated)
    setValues((current) => ({ ...current, dueDate: updated.dueDate, dueTime: updated.dueTime }))
  }

  const title = !isEditable ? text.viewTitle : task ? text.editTitle : text.createTitle
  const completedText =
    task && isTaskDone(task) && task.completedAt
      ? task.completedBy
        ? text.completedBy(task.completedBy.name, format.fullDayOf(task.completedAt))
        : text.completedOn(format.fullDayOf(task.completedAt))
      : null

  const tabs: TabDefinition<TaskTab>[] = [
    {
      value: 'general',
      label: text.tabs.general,
      invalid: Boolean(errors.title || errors.dueDate || errors.dueTime || errors.estimate || errors.recurrence),
      content: (
        <>
          <Locked isLocked={!isEditable}>
            <TextField
              label={text.title}
              name="title"
              value={values.title}
              maxLength={TASK_TITLE_MAX_LENGTH}
              error={errors.title}
              required
              data-autofocus
              onChange={(value) => update({ title: value })}
            />
          </Locked>
          <Locked isLocked={!canProgress || progress.isPending}>
            <SelectField
              label={text.status}
              name="status"
              value={values.status}
              options={TASK_STATUSES.map((status) => ({ value: status, label: text.statuses[status] }))}
              onChange={changeStatus}
            />
          </Locked>
          <Locked isLocked={!isEditable}>
            <SelectField
              label={text.priority}
              name="priority"
              value={values.priority}
              options={TASK_PRIORITIES.map((priority) => ({ value: priority, label: text.priorities[priority] }))}
              onChange={(priority) => update({ priority })}
            />
            <TaskDueFields values={values} errors={errors} onChange={update} />
            <TaskEstimateField value={estimate} error={errors.estimate} onChange={changeEstimate} />
          </Locked>
        </>
      ),
    },
    {
      value: 'checklist',
      label: m.calendars.settings.withCount(text.tabs.checklist, values.checklist.length),
      content: (
        <ChecklistField
          items={values.checklist}
          isEditable={isEditable}
          canToggle={canProgress && !progress.isPending}
          onChange={(checklist) => update({ checklist })}
          onToggle={toggleChecklistItem}
        />
      ),
    },
    {
      value: 'details',
      label: text.tabs.details,
      invalid: Boolean(errors.notes),
      content: (
        <Locked isLocked={!isEditable}>
          <FormField label={text.notes} error={errors.notes}>
            <textarea
              className="textarea"
              name="notes"
              rows={5}
              maxLength={TASK_NOTES_MAX_LENGTH}
              value={values.notes}
              onChange={(event) => update({ notes: event.target.value })}
            />
          </FormField>
          {canChooseCalendar && (
            <SelectField
              label={text.calendar}
              name="calendar"
              value={calendarId}
              options={calendarOptions.map(({ id, name }) => ({ value: id, label: name }))}
              onChange={changeCalendar}
            />
          )}
          {assigneeOptions.length > 0 && (
            <SelectField
              label={text.assignee}
              name="assignee"
              value={values.assigneeId ?? NOBODY}
              options={[
                { value: NOBODY, label: text.nobody },
                ...assigneeOptions.map(({ id, name }) => ({ value: id, label: name })),
              ]}
              onChange={(assigneeId) => update({ assigneeId: assigneeId || null })}
            />
          )}
          {!isEditable && task?.assignee && assigneeOptions.length === 0 && (
            <p className="formHint">{text.assignedTo(task.assignee.name)}</p>
          )}
          <CategoryField
            categories={calendarCategories}
            value={values.categoryIds}
            builtin={values.builtinCategories}
            onChange={(categoryIds) => update({ categoryIds })}
            onBuiltinChange={(builtinCategories) => update({ builtinCategories })}
            onCreate={isEditable && onCreateCategory ? (name) => onCreateCategory(calendarId, name) : undefined}
          />
        </Locked>
      ),
    },
  ]

  return (
    <>
      <Modal title={title} onClose={onClose}>
        <Form className="taskForm" onSubmit={handleSubmit}>
          {!task && onSwitchToEvent && (
            <SegmentedControl
              label={text.kind.label}
              value="task"
              options={[
                { value: 'event', label: text.kind.event },
                { value: 'task', label: text.kind.task },
              ]}
              onChange={(kind) => {
                if (kind === 'event') onSwitchToEvent({ title: values.title.trim(), date: values.dueDate })
              }}
            />
          )}
          <Tabs label={text.tabsLabel} tabs={tabs} value={activeTab} stable onChange={setActiveTab} />
          {completedText && <p className="formHint">{completedText}</p>}
          {canPlan && planHint === text.plan.saveFirst && <p className="formHint">{planHint}</p>}
          <ErrorMessage message={saveError ?? progress.error} />
          <div className="modalActions">
            {isEditable && (
              <Button type="submit" isPending={isPending} pendingLabel={m.common.saving}>
                {m.common.save}
              </Button>
            )}
            {canPlan && (
              <span className="buttonHint" title={planHint}>
                <Button
                  variant="outline"
                  title={planHint}
                  disabled={isPending || planHint !== undefined}
                  onClick={() => setIsPlanOpen(true)}
                >
                  {hasPlanned || hasFutureBlocks ? text.plan.again : text.plan.open}
                </Button>
              </span>
            )}
            {task && access.canDelete(task) && (
              <Button variant="danger" disabled={isPending} onClick={() => setIsDeleteOpen(true)}>
                {m.common.delete}
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>
              {isEditable ? m.common.cancel : m.common.close}
            </Button>
          </div>
        </Form>
      </Modal>
      {task && planning && isPlanOpen && (
        <Suspense fallback={null}>
          <TaskPlanModal
            task={task}
            setup={planning}
            onReschedule={isEditable ? onReschedule : undefined}
            onTaskChange={takeRescheduled}
            onPlanned={() => setHasPlanned(true)}
            initialDistribution={resumePlan}
            onPreview={onPlanPreview}
            onClose={() => setIsPlanOpen(false)}
          />
        </Suspense>
      )}
      {task && isDeleteOpen && (
        <ConfirmModal
          title={text.deleteTitle}
          confirmLabel={m.common.delete}
          pendingLabel={m.common.deleting}
          onConfirm={() => onDelete(task)}
          onClose={() => setIsDeleteOpen(false)}
        >
          {text.deleteMessage(task.title)}
        </ConfirmModal>
      )}
    </>
  )
}
