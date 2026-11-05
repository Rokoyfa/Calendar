import type { SubmitEventHandler } from 'react'
import type { FieldErrors } from '../utils/validation.ts'
import { useAsyncAction } from './useAsyncAction.ts'
import { useFormState } from './useFormState.ts'

type FormOptions<T extends object> = {
  initialValues: T
  validate: (values: T) => FieldErrors<T>
  prepare?: (values: T) => T
  onSubmit: (values: T) => Promise<void>
}

export function useForm<T extends object>({ initialValues, validate, prepare, onSubmit }: FormOptions<T>) {
  const form = useFormState(initialValues, validate)
  const action = useAsyncAction(onSubmit)

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    const prepared = prepare ? prepare(form.values) : form.values
    if (form.validateAll(prepared)) void action.run(prepared)
  }

  return { ...form, ...action, handleSubmit }
}
