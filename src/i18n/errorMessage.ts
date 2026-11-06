import { isApiError } from '../utils/apiError.ts'
import { isAppError } from '../utils/appError.ts'
import type { Messages } from './messages/index.ts'

const SERVER_ERROR_STATUS = 500

export function getErrorMessage(error: unknown, m: Messages) {
  if (isAppError(error)) return m.errors[error.code]
  if (isApiError(error)) {
    if (error.code) return m.errors[error.code]
    if (error.serverMessage) return error.serverMessage
    if (error.kind !== 'http' || error.status === null) return error.kind === 'http' ? m.errors.unknown : m.errors.kind[error.kind]
    return (
      m.errors.status[error.status] ??
      (error.status >= SERVER_ERROR_STATUS ? m.errors.serverError : m.errors.requestFailed(error.status))
    )
  }
  return m.errors.unknown
}
