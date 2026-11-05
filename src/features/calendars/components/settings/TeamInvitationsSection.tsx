import { useState } from 'react'
import { Button } from '../../../../components/Button.tsx'
import { Form } from '../../../../components/Form.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { SelectField } from '../../../../components/SelectField.tsx'
import { ActionFeedback, ErrorMessage } from '../../../../components/StatusMessage.tsx'
import { TextField } from '../../../../components/TextField.tsx'
import { useAsyncAction } from '../../../../hooks/useAsyncAction.ts'
import { formatLongDate, toISODate } from '../../../../utils/date.ts'
import { EMAIL_MAX_LENGTH, normalizeEmail } from '../../../../utils/validation.ts'
import { DEFAULT_INVITATION_ROLE, ROLE_DESCRIPTIONS, ROLE_LABELS } from '../../constants/calendars.ts'
import type { CalendarSummary, InvitableRole, Invitation, TeamInvitation, TeamMember } from '../../types/calendar.ts'
import { validateInvitation } from '../../utils/draft.ts'
import { getInvitableRoles, outranks } from '../../utils/permissions.ts'

type TeamInvitationsSectionProps = {
  calendar: CalendarSummary
  invitations: readonly TeamInvitation[]
  members: readonly TeamMember[]
  error: string | null
  ownEmail: string | null
  onInvite: (invitation: Invitation) => Promise<void>
  onRevoke: (invitationId: string) => Promise<void>
}

function InvitationRow({
  invitation,
  canRevoke,
  onRevoke,
}: {
  invitation: TeamInvitation
  canRevoke: boolean
  onRevoke: () => Promise<void>
}) {
  const { run, isPending, error } = useAsyncAction(onRevoke)
  return (
    <li className="itemRow">
      <span className="itemRowMain">
        <span className="itemRowTitle">{invitation.email}</span>
        <span className="itemRowMeta">
          {ROLE_LABELS[invitation.role]} · gültig bis {formatLongDate(toISODate(new Date(invitation.expiresAt)))}
        </span>
        <ActionFeedback error={error} />
      </span>
      {canRevoke && (
        <Button variant="outline" isPending={isPending} pendingLabel="Wird zurückgezogen …" onClick={() => void run()}>
          Zurückziehen
        </Button>
      )}
    </li>
  )
}

export function TeamInvitationsSection({
  calendar,
  invitations,
  members,
  error,
  ownEmail,
  onInvite,
  onRevoke,
}: TeamInvitationsSectionProps) {
  const roles = getInvitableRoles(calendar.role)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InvitableRole>(
    roles.includes(DEFAULT_INVITATION_ROLE) ? DEFAULT_INVITATION_ROLE : roles[0],
  )
  const [fieldError, setFieldError] = useState<string>()
  const [sentTo, setSentTo] = useState<string | null>(null)
  const send = useAsyncAction(async (invitation: Invitation) => {
    await onInvite(invitation)
    setSentTo(invitation.email)
    setEmail('')
  })

  const submit = () => {
    const invitation = { email: normalizeEmail(email), role }
    const memberError = members.some((member) => member.email === invitation.email)
      ? 'Diese Person ist schon Mitglied.'
      : undefined
    const errors = validateInvitation(invitation, invitations, ownEmail)
    const message = memberError ?? errors.email
    setFieldError(message)
    setSentTo(null)
    if (!message) void send.run(invitation)
  }

  return (
    <PageSection
      title="Einladungen"
      description="Neue Mitglieder per E-Mail einladen. Du kannst nur Rollen unterhalb deiner eigenen vergeben. Eine Einladung ist 7 Tage gültig."
    >
      <Form
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <div className="formRow inviteRow">
          <TextField
            label="E-Mail-Adresse"
            name="inviteEmail"
            type="email"
            inputMode="email"
            autoComplete="off"
            maxLength={EMAIL_MAX_LENGTH}
            value={email}
            error={fieldError}
            onChange={(value) => {
              setEmail(value)
              setFieldError(undefined)
            }}
          />
          <SelectField
            label="Rolle"
            name="inviteRole"
            value={role}
            options={roles.map((value) => ({ value, label: ROLE_LABELS[value] }))}
            onChange={setRole}
          />
          <Button type="submit" className="inviteAdd" isPending={send.isPending} pendingLabel="Wird gesendet …">
            Einladen
          </Button>
        </div>
        <p className="formHint">
          {ROLE_LABELS[role]}: {ROLE_DESCRIPTIONS[role]}
        </p>
        <ActionFeedback error={send.error} success={sentTo && `Einladung an ${sentTo} verschickt.`} />
      </Form>

      <ErrorMessage message={error} />
      {invitations.length === 0 ? (
        <p className="emptyHint">Keine offenen Einladungen.</p>
      ) : (
        <ul className="itemList">
          {invitations.map((invitation) => (
            <InvitationRow
              key={invitation.id}
              invitation={invitation}
              canRevoke={outranks(calendar.role, invitation.role)}
              onRevoke={() => onRevoke(invitation.id)}
            />
          ))}
        </ul>
      )}
    </PageSection>
  )
}
