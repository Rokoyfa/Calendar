import { isApiError } from './apiError.ts'
import { isAppError } from './appError.ts'

export const isEventChanged = (error: unknown) =>
  (isAppError(error) || isApiError(error)) && error.code === 'eventChanged'
