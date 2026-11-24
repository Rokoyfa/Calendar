import { useCallback, useMemo, useState, type SubmitEventHandler } from 'react'
import { Button } from '../../../components/Button.tsx'
import { ConfirmModal } from '../../../components/ConfirmModal.tsx'
import { Form } from '../../../components/Form.tsx'
import { FormField } from '../../../components/FormField.tsx'
import { Modal } from '../../../components/Modal.tsx'
import { SegmentedControl } from '../../../components/SegmentedControl.tsx'
import { SelectField } from '../../../components/SelectField.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import { useI18n } from '../../../i18n/index.ts'
import { isISODate, isTime, MINUTES_PER_HOUR } from '../../../utils/date.ts'
import type { Task, TaskAccess, TaskCalendarChoice, TaskDraft, TaskInput, TaskPerson } from '../types/task.ts'
import {
  EMPTY_TASK_INPUT,
  isTaskDone,
  normalizeTaskInput,
  TASK_NOTES_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
  toTaskInput,
} from '../utils/task.ts'

type TaskErrors = Partial<Record<'title' | 'notes' | 'dueDate' | 'dueTime' | 'estimate', string>>

type EstimateParts = { hours: string; minutes: string }

const MAX_ESTIMATE_HOURS = 99

const NOBODY = ''
const NO_PEOPLE: TaskPerson[] = []

export type TaskModalProps = {
  task: Task | null
  draft: TaskDraft
  defaultCalendarId: string
  choices: readonly TaskCalendarChoice[]
  calendarNames: ReadonlyMap<string, string>
  access: TaskAccess
  loadAssignees?: (calendarId: string) => Promise<TaskPerson[]>
  onSave: (input: TaskInput, calendarId: string) => Promise<void>
  onToggle: (task: Task) => Promise<void>
  onDelete: (task: Task) => Promise<void>
  onSwitchToEvent?: (draft: { title: string; date: string | null }) => void
  onClose: () => void
}

const initialInput = (task: Task | null, draft: TaskDraft): TaskInput =>
  task ? toTaskInput(task) : { ...EMPTY_TASK_INPUT, ...draft }

const toEstimateParts = (minutes: number | null): EstimateParts =>
  minutes === null
    ? { hours: '', minutes: '' }
    : {
        hours: minutes >= MINUTES_PER_HOUR ? String(Math.floor(minutes / MINUTES_PER_HOUR)) : '',
        minutes: minutes % MINUTES_PER_HOUR > 0 ? String(minutes % MINUTES_PER_HOUR) : '',
      }

const readPart = (text: string, max: number) => {
  if (text.trim() === '') return 0
  const value = Number(text)
  return Number.isInteger(value) && value >= 0 && value <= max ? value : null
}

const toEstimateMinutes = ({ hours, minutes }: EstimateParts) => {
  const wholeHours = readPart(hours, MAX_ESTIMATE_HOURS)
  const restMinutes = readPart(minutes, MINUTES_PER_HOUR - 1)
  if (wholeHours === null || restMinutes === null) return undefined
  const total = wholeHours * MINUTES_PER_HOUR + restMinutes
  return total === 0 ? null : total
}

const withCurrent = (choices: readonly TaskCalendarChoice[], current: TaskCalendarChoice | null) =>
  current && !choices.some((choice) => choice.id === current.id) ? [current, ...choices] : choices

export function TaskModal({
  task,
  draft,
  defaultCalendarId,
  choices,
  calendarNames,
  access,
  loadAssignees,
  onSave,
  onToggle,
  onDelete,
  onSwitchToEvent,
  onClose,
}: TaskModalProps) {
  const { m, format } = useI18n()
  const text = m.tasks
  const readOnly = task !== null && !access.canEdit(task)
  const [values, setValues] = useState(() => initialInput(task, draft))
  const [calendarId, setCalendarId] = useState(() => task?.calendarId ?? draft.calendarId ?? defaultCalendarId)
  const [estimate, setEstimate] = useState(() =>
    toEstimateParts(task?.estimateMinutes ?? draft.estimateMinutes ?? null),
  )
  const [errors, setErrors] = useState<TaskErrors>({})
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const loadPeople = useCallback(
    async () => (loadAssignees ? loadAssignees(calendarId) : NO_PEOPLE),
    [loadAssignees, calendarId],
  )
  const { data: people } = useAsyncResource(loadPeople, NO_PEOPLE)
  const assigneeOptions = useMemo(() => {
    const known = task?.assignee && !people.some(({ id }) => id === task.assignee?.id) ? [task.assignee] : []
    return [...known, ...people]
  }, [people, task])

  const calendarOptions = withCurrent(
    choices,
    task ? { id: task.calendarId, name: calendarNames.get(task.calendarId) ?? '' } : null,
  )
  const canChooseCalendar = !readOnly && calendarOptions.length > 1 && (task === null || access.canDelete(task))

  const {
    run: save,
    isPending,
    error: saveError,
  } = useAsyncAction(async (input: TaskInput) => {
    await onSave(input, calendarId)
  })
  const {
    run: toggle,
    isPending: isToggling,
    error: toggleError,
  } = useAsyncAction(async () => {
    if (task) await onToggle(task)
  })

  const update = (changes: Partial<TaskInput>) => {
    setValues((current) => ({ ...current, ...changes }))
    setErrors((current) => ({ ...current, ...Object.fromEntries(Object.keys(changes).map((key) => [key, undefined])) }))
  }

  const changeCalendar = (next: string) => {
    setCalendarId(next)
    update({ assigneeId: null })
  }

  const changeEstimate = (changes: Partial<EstimateParts>) => {
    setEstimate((current) => ({ ...current, ...changes }))
    setErrors((current) => ({ ...current, estimate: undefined }))
  }

  const validate = (input: TaskInput, estimateMinutes: number | null | undefined): TaskErrors => ({
    title: !input.title
      ? m.validation.titleRequired
      : input.title.length > TASK_TITLE_MAX_LENGTH
        ? m.validation.titleTooLong(TASK_TITLE_MAX_LENGTH)
        : undefined,
    notes: input.notes.length > TASK_NOTES_MAX_LENGTH ? m.validation.notesTooLong(TASK_NOTES_MAX_LENGTH) : undefined,
    dueDate: input.dueDate !== null && !isISODate(input.dueDate) ? m.validation.dateInvalid : undefined,
    dueTime: input.dueTime !== null && !isTime(input.dueTime) ? m.validation.timeInvalid : undefined,
    estimate: estimateMinutes === undefined ? text.estimateInvalid : undefined,
  })

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    if (readOnly) return
    const estimateMinutes = toEstimateMinutes(estimate)
    const input = normalizeTaskInput({ ...values, estimateMinutes: estimateMinutes ?? null })
    const found = validate(input, estimateMinutes)
    setErrors(found)
    if (Object.values(found).some(Boolean)) return
    void save(input)
  }

  const title = readOnly ? text.viewTitle : task ? text.editTitle : text.createTitle
  const completedText =
    task && isTaskDone(task) && task.completedAt
      ? task.completedBy
        ? text.completedBy(task.completedBy.name, format.fullDayOf(task.completedAt))
        : text.completedOn(format.fullDayOf(task.completedAt))
      : null

  const fields = (
    <>
      <TextField
        label={text.title}
        name="title"
        value={values.title}
        maxLength={TASK_TITLE_MAX_LENGTH}
        error={errors.title}
        required
        data-autofocus
        onChange={(title) => update({ title })}
      />
      <div className="formRow">
        <FormField label={text.dueDate} error={errors.dueDate}>
          <input
            className="input"
            type="date"
            name="dueDate"
            value={values.dueDate ?? ''}
            aria-invalid={Boolean(errors.dueDate)}
            onChange={(event) =>
              update(event.target.value ? { dueDate: event.target.value } : { dueDate: null, dueTime: null })
            }
          />
        </FormField>
        {values.dueDate && (
          <FormField label={text.dueTime} error={errors.dueTime}>
            <input
              className="input"
              type="time"
              name="dueTime"
              value={values.dueTime ?? ''}
              aria-invalid={Boolean(errors.dueTime)}
              onChange={(event) => update({ dueTime: event.target.value || null })}
            />
          </FormField>
        )}
      </div>
      <FormField label={text.estimate} as="fieldset" error={errors.estimate}>
        <span className="inlineField taskEstimate">
          <input
            className="input numberInput"
            type="number"
            name="estimateHours"
            inputMode="numeric"
            min={0}
            max={MAX_ESTIMATE_HOURS}
            step={1}
            placeholder="0"
            aria-label={text.hours}
            aria-invalid={Boolean(errors.estimate)}
            value={estimate.hours}
            onChange={(event) => changeEstimate({ hours: event.target.value })}
          />
          <span aria-hidden="true">{text.hoursUnit}</span>
          <input
            className="input numberInput"
            type="number"
            name="estimateMinutes"
            inputMode="numeric"
            min={0}
            max={MINUTES_PER_HOUR - 1}
            step={5}
            placeholder="0"
            aria-label={text.minutes}
            aria-invalid={Boolean(errors.estimate)}
            value={estimate.minutes}
            onChange={(event) => changeEstimate({ minutes: event.target.value })}
          />
          <span aria-hidden="true">{text.minutesUnit}</span>
        </span>
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
      {readOnly && task?.assignee && assigneeOptions.length === 0 && (
        <p className="formHint">{text.assignedTo(task.assignee.name)}</p>
      )}
      <FormField label={text.notes} error={errors.notes}>
        <textarea
          className="textarea"
          name="notes"
          rows={4}
          maxLength={TASK_NOTES_MAX_LENGTH}
          value={values.notes}
          onChange={(event) => update({ notes: event.target.value })}
        />
      </FormField>
    </>
  )

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
          {completedText && <p className="formHint">{completedText}</p>}
          {readOnly ? (
            <fieldset className="readOnlyFields" disabled>
              {fields}
            </fieldset>
          ) : (
            fields
          )}
          <ErrorMessage message={saveError ?? toggleError} />
          <div className="modalActions">
            {!readOnly && (
              <Button type="submit" isPending={isPending} pendingLabel={m.common.saving}>
                {m.common.save}
              </Button>
            )}
            {task && access.canComplete(task) && (
              <Button variant="outline" isPending={isToggling} disabled={isPending} onClick={() => void toggle()}>
                {isTaskDone(task) ? text.markOpen : text.markDone}
              </Button>
            )}
            {task && access.canDelete(task) && (
              <Button variant="danger" disabled={isPending || isToggling} onClick={() => setIsDeleteOpen(true)}>
                {m.common.delete}
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>
              {readOnly ? m.common.close : m.common.cancel}
            </Button>
          </div>
        </Form>
      </Modal>
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
