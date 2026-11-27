import { FormField } from '../../../components/FormField.tsx'
import { adaptRecurrenceToStart } from '../../../domain/recurrence.ts'
import { useI18n } from '../../../i18n/index.ts'
import { RecurrenceFields } from '../../events/index.ts'
import type { TaskInput } from '../types/task.ts'
import type { TaskErrors } from '../utils/taskForm.ts'
import { Input } from '../../../components/Input.tsx'

type TaskDueFieldsProps = {
  values: TaskInput
  errors: TaskErrors
  onChange: (changes: Partial<TaskInput>) => void
}

export function TaskDueFields({ values, errors, onChange }: TaskDueFieldsProps) {
  const text = useI18n().m.tasks
  return (
    <>
      <div className="formRow">
        <FormField label={text.dueDate} error={errors.dueDate}>
          <Input
            type="date"
            name="dueDate"
            value={values.dueDate ?? ''}
            aria-invalid={Boolean(errors.dueDate)}
            onChange={(event) =>
              onChange(
                event.target.value
                  ? {
                      dueDate: event.target.value,
                      recurrence: values.dueDate
                        ? adaptRecurrenceToStart(values.recurrence, values.dueDate, event.target.value)
                        : values.recurrence,
                    }
                  : { dueDate: null, dueTime: null, recurrence: null },
              )
            }
          />
        </FormField>
        {values.dueDate && (
          <FormField label={text.dueTime} error={errors.dueTime}>
            <Input
              type="time"
              name="dueTime"
              value={values.dueTime ?? ''}
              aria-invalid={Boolean(errors.dueTime)}
              onChange={(event) => onChange({ dueTime: event.target.value || null })}
            />
          </FormField>
        )}
      </div>
      {values.dueDate ? (
        <>
          <RecurrenceFields
            value={values.recurrence}
            startDate={values.dueDate}
            errors={errors.recurrence ?? {}}
            onChange={(recurrence) => onChange({ recurrence })}
          />
          {values.recurrence && <p className="formHint">{text.recurrenceHint}</p>}
        </>
      ) : (
        <p className="formHint">{text.recurrenceNeedsDue}</p>
      )}
    </>
  )
}
