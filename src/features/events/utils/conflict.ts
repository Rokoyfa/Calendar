import { isApiError } from '../../../utils/apiError.ts'
import { isAppError, type ErrorCode } from '../../../utils/appError.ts'

export const hasErrorCode = (error: unknown, code: ErrorCode) =>
  (isAppError(error) || isApiError(error)) && error.code === code

export const isEventChanged = (error: unknown) => hasErrorCode(error, 'eventChanged')
