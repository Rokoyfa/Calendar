import type { ErrorCode } from '../../../utils/appError.ts'
import type { ApiErrorKind } from '../../../utils/apiError.ts'

export const common = {
  loading: 'Loading …',
  close: 'Close',
  cancel: 'Cancel',
  save: 'Save',
  saving: 'Saving …',
  saved: 'Saved.',
  delete: 'Delete',
  deleting: 'Deleting …',
  backToCalendar: 'Back to calendar',
  backToSettings: 'Back to settings',
  settings: 'Settings',
  progress: 'Progress',
  next: 'Next',
  back: 'Back',
}

export const errors: Record<ErrorCode, string> & {
  status: Partial<Record<number, string>>
  serverError: string
  requestFailed: (status: number) => string
  kind: Record<Exclude<ApiErrorKind, 'http'>, string>
} = {
  unknown: 'An unknown error occurred.',
  eventNotFound: 'The event could not be found.',
  accountRequired: 'Team calendars require an account.',
  saveEventsFailed: 'The events could not be saved in this browser.',
  savePreferencesFailed: 'The settings could not be saved in this browser.',
  saveColorFailed: 'The color could not be saved in this browser.',
  saveDecisionFailed: 'Your choice could not be saved in this browser.',
  invalidLink: 'This link is invalid or has expired.',
  invalidResetLink: 'This link is invalid or has expired. Please request a new one.',
  invalidCredentials: 'Email address or password is incorrect.',
  emailTaken: 'An account with this email address already exists.',
  wrongCurrentPassword: 'The current password is incorrect.',
  wrongPassword: 'The password is incorrect.',
  soleOwner: 'You are the only owner of a team with other members. Please transfer ownership first.',
  status: {
    400: 'The request was invalid.',
    401: 'Please sign in.',
    403: 'You do not have permission to do that.',
    404: 'The item could not be found.',
    409: 'The item has changed in the meantime. Please reload.',
    413: 'The data is too large.',
    422: 'The input is invalid.',
    429: 'Too many requests. Please wait a moment.',
  },
  serverError: 'Something went wrong on the server.',
  requestFailed: (status) => `The request failed (${status}).`,
  kind: {
    timeout: 'The server did not respond in time.',
    network: 'The server cannot be reached.',
    aborted: 'The request was cancelled.',
    parse: 'The server response could not be read.',
  },
}

export const validation = {
  emailRequired: 'Please enter an email address.',
  emailInvalid: 'Please enter a valid email address.',
  integerRange: (min: number, max: number) => `Please enter a whole number from ${min} to ${max}.`,
  titleRequired: 'Please enter a title.',
  titleTooLong: (max: number) => `The title can be at most ${max} characters long.`,
  descriptionTooLong: (max: number) => `The description can be at most ${max} characters long.`,
  startDateInvalid: 'Please choose a valid start date.',
  startTimeInvalid: 'Please choose a valid start time.',
  endDateInvalid: 'Please choose a valid end date.',
  endTimeInvalid: 'Please choose a valid end time.',
  endDateBeforeStart: 'The end date cannot be before the start date.',
  endBeforeStart: 'The end must be after the start.',
  weekdaysRequired: 'Please choose at least one weekday.',
  dateInvalid: 'Please choose a valid date.',
  untilBeforeStart: 'The repetition cannot end before the start date.',
}

export const colors = {
  blue: 'Blue',
  red: 'Red',
  green: 'Green',
  yellow: 'Yellow',
}

export const themes = {
  system: 'Match system',
  light: 'Light',
  dark: 'Dark',
}

export const recurrence = {
  frequency: { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' },
  units: {
    daily: { one: 'day', many: 'days' },
    weekly: { one: 'week', many: 'weeks' },
    monthly: { one: 'month', many: 'months' },
    yearly: { one: 'year', many: 'years' },
  },
  every: (interval: number, unit: string) => `Every ${interval} ${unit}`,
  onWeekdays: (weekdays: string) => ` on ${weekdays}`,
  onDate: (date: string) => ` on ${date}`,
  monthlyOnDay: (day: number) => `on day ${day}`,
  monthlyOnWeekday: (ordinal: number, weekday: string) =>
    `on the ${['first', 'second', 'third', 'fourth', 'fifth'][ordinal - 1]} ${weekday}`,
  monthlyOnLastWeekday: (weekday: string) => `on the last ${weekday}`,
  until: (date: string) => ` until ${date}`,
  times: (count: number) => (count === 1 ? ', once' : `, ${count} times`),
}
