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
  'unauthorized',
  'forbidden',
  'notFound',
  'serverError',
  'payloadTooLarge',
  'calendarNotFound',
  'teamNotFound',
  'memberNotFound',
  'invitationNotFound',
  'invitationExpired',
  'tooManyLoginAttempts',
  'seriesHasDetached',
  'selfInvite',
  'alreadyMember',
  'alreadyInvited',
  'personalTeam',
  'lastOwner',
  'alreadyOwner',
  'lastCalendar',
  'tooManyColors',
  'managedByHost',
  'unknownTenant',
  'originNotAllowed',
  'invalidUserToken',
] as const

export const isErrorCode = (value: unknown): value is ErrorCode =>
  typeof value === 'string' && (ERROR_CODES as readonly string[]).includes(value)

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
