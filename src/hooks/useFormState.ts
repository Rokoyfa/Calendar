import { useCallback, useState } from 'react'
import { hasFieldErrors, type FieldErrors } from '../utils/validation.ts'

export function useFormState<T extends object>(initialValues: T, validate: (values: T) => FieldErrors<T>) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<FieldErrors<T>>({})

  const setField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current))
  }, [])

  const validateAll = (prepared: T = values) => {
    const nextErrors = validate(prepared)
    setErrors(nextErrors)
    return !hasFieldErrors(nextErrors)
  }

  return { values, errors, setField, validateAll }
}
