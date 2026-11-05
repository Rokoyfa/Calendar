import { normalizeEmail, validateEmail, type FieldErrors } from '../../../utils/validation.ts'
import { CALENDAR_DESCRIPTION_MAX_LENGTH, CALENDAR_NAME_MAX_LENGTH, MAX_INVITATIONS } from '../constants/calendars.ts'
import type { CalendarDraft, Invitation } from '../types/calendar.ts'

export type DetailsValues = Pick<CalendarDraft, 'name' | 'description'>

export const validateDetails = ({ name, description }: DetailsValues): FieldErrors<DetailsValues> => ({
  name: !name.trim()
    ? 'Bitte einen Namen eingeben.'
    : name.trim().length > CALENDAR_NAME_MAX_LENGTH
      ? `Der Name darf höchstens ${CALENDAR_NAME_MAX_LENGTH} Zeichen lang sein.`
      : undefined,
  description:
    description.trim().length > CALENDAR_DESCRIPTION_MAX_LENGTH
      ? `Die Beschreibung darf höchstens ${CALENDAR_DESCRIPTION_MAX_LENGTH} Zeichen lang sein.`
      : undefined,
})

export const validateInvitation = (
  { email }: Invitation,
  existing: readonly Invitation[],
  ownEmail: string | null,
): FieldErrors<Invitation> => {
  const normalized = normalizeEmail(email)
  if (existing.length >= MAX_INVITATIONS) return { email: `Höchstens ${MAX_INVITATIONS} Einladungen auf einmal.` }
  if (normalized === ownEmail) return { email: 'Du bist automatisch Owner und musst dich nicht einladen.' }
  if (existing.some((invitation) => invitation.email === normalized))
    return { email: 'Diese Adresse ist schon eingeladen.' }
  return { email: validateEmail(normalized) }
}

export const normalizeDraft = (draft: CalendarDraft): CalendarDraft => ({
  ...draft,
  name: draft.name.trim(),
  description: draft.description.trim(),
})
