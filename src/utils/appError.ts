export const ERROR_CODES = [
  'unknown',
  'eventNotFound',
  'accountRequired',
  'saveEventsFailed',
  'savePreferencesFailed',
  'saveColorFailed',
  'saveDecisionFailed',
  'invalidLink',
  'invalidResetLink',
  'invalidCredentials',
  'emailTaken',
  'wrongCurrentPassword',
  'wrongPassword',
  'soleOwner',
] as const

export type ErrorCode = (typeof ERROR_CODES)[number]

export class AppError extends Error {
  readonly code: ErrorCode

  constructor(code: ErrorCode, options?: { cause?: unknown }) {
    super(code, options)
    this.name = 'AppError'
    this.code = code
  }
}

export const isAppError = (error: unknown): error is AppError => error instanceof AppError
