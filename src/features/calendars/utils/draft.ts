import type { Messages } from '../../../i18n/index.ts'
import { normalizeEmail, validateEmail, type FieldErrors } from '../../../utils/validation.ts'
import { CALENDAR_DESCRIPTION_MAX_LENGTH, CALENDAR_NAME_MAX_LENGTH, MAX_INVITATIONS } from '../constants/calendars.ts'
import type { CalendarDraft, Invitation } from '../types/calendar.ts'

export type DetailsValues = Pick<CalendarDraft, 'name' | 'description'>

export const validateDetails = ({ name, description }: DetailsValues, m: Messages): FieldErrors<DetailsValues> => ({
  name: !name.trim()
    ? m.calendars.validation.nameRequired
    : name.trim().length > CALENDAR_NAME_MAX_LENGTH
      ? m.calendars.validation.nameTooLong(CALENDAR_NAME_MAX_LENGTH)
      : undefined,
  description:
    description.trim().length > CALENDAR_DESCRIPTION_MAX_LENGTH
      ? m.validation.descriptionTooLong(CALENDAR_DESCRIPTION_MAX_LENGTH)
      : undefined,
})

export const validateInvitation = (
  { email }: Invitation,
  existing: readonly Invitation[],
  ownEmail: string | null,
  m: Messages,
): FieldErrors<Invitation> => {
  const normalized = normalizeEmail(email)
  if (existing.length >= MAX_INVITATIONS) return { email: m.calendars.validation.tooManyInvitations(MAX_INVITATIONS) }
  if (normalized === ownEmail) return { email: m.calendars.validation.selfInvite }
  if (existing.some((invitation) => invitation.email === normalized))
    return { email: m.calendars.validation.alreadyInvited }
  return { email: validateEmail(normalized, m) }
}

export const normalizeDraft = (draft: CalendarDraft): CalendarDraft => ({
  ...draft,
  name: draft.name.trim(),
  description: draft.description.trim(),
})
