import { hasRecurrenceErrors, validateRecurrence, type RecurrenceValidationErrors } from '../../../domain/recurrence.ts'
import type { Messages } from '../../../i18n/index.ts'
import { isISODate, isTime, MINUTES_PER_HOUR } from '../../../utils/date.ts'
import type { TaskInput } from '../types/task.ts'
import { TASK_NOTES_MAX_LENGTH, TASK_TITLE_MAX_LENGTH } from './task.ts'

export type TaskErrors = Partial<Record<'title' | 'notes' | 'dueDate' | 'dueTime' | 'estimate', string>> & {
  recurrence?: RecurrenceValidationErrors
}

export type EstimateParts = { hours: string; minutes: string }

export const MAX_ESTIMATE_HOURS = 99

export const toEstimateParts = (minutes: number | null): EstimateParts =>
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

export const toEstimateMinutes = ({ hours, minutes }: EstimateParts) => {
  const wholeHours = readPart(hours, MAX_ESTIMATE_HOURS)
  const restMinutes = readPart(minutes, MINUTES_PER_HOUR - 1)
  if (wholeHours === null || restMinutes === null) return undefined
  const total = wholeHours * MINUTES_PER_HOUR + restMinutes
  return total === 0 ? null : total
}

export const validateTaskInput = (
  input: TaskInput,
  estimateMinutes: number | null | undefined,
  m: Messages,
): TaskErrors => ({
  title: !input.title
    ? m.validation.titleRequired
    : input.title.length > TASK_TITLE_MAX_LENGTH
      ? m.validation.titleTooLong(TASK_TITLE_MAX_LENGTH)
      : undefined,
  notes: input.notes.length > TASK_NOTES_MAX_LENGTH ? m.validation.notesTooLong(TASK_NOTES_MAX_LENGTH) : undefined,
  dueDate: input.dueDate !== null && !isISODate(input.dueDate) ? m.validation.dateInvalid : undefined,
  dueTime: input.dueTime !== null && !isTime(input.dueTime) ? m.validation.timeInvalid : undefined,
  estimate: estimateMinutes === undefined ? m.tasks.estimateInvalid : undefined,
  recurrence:
    input.recurrence && input.dueDate && hasRecurrenceErrors(validateRecurrence(input.recurrence, input.dueDate, m))
      ? validateRecurrence(input.recurrence, input.dueDate, m)
      : undefined,
})
