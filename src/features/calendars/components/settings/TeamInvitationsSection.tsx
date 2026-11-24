import { useState } from 'react'
import { Button } from '../../../../components/Button.tsx'
import { Form } from '../../../../components/Form.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { SelectField } from '../../../../components/SelectField.tsx'
import { ActionFeedback, ErrorMessage } from '../../../../components/StatusMessage.tsx'
import { EmailTextField } from '../../../../components/TextField.tsx'
import { useAsyncAction } from '../../../../hooks/useAsyncAction.ts'
import { useI18n } from '../../../../i18n/index.ts'
import { normalizeEmail } from '../../../../utils/validation.ts'
import { DEFAULT_INVITATION_ROLE } from '../../constants/calendars.ts'
import type { CalendarSummary, InvitableRole, Invitation, TeamInvitation, TeamMember } from '../../types/calendar.ts'
import { validateInvitation } from '../../utils/draft.ts'
import { getInvitableRoles, outranks } from '../../utils/permissions.ts'
import { ItemList } from '../../../../components/ItemList.tsx'

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
  const { m, format } = useI18n()
  const { teamInvitations: text, invitations, roles } = m.calendars
  const { run, isPending, error } = useAsyncAction(onRevoke)
  return (
    <li className="itemRow">
      <span className="itemRowMain">
        <span className="itemRowTitle">{invitation.email}</span>
        <span className="itemRowMeta">
          {roles[invitation.role]} · {invitations.validUntil(format.longDateOf(invitation.expiresAt))}
        </span>
        <ActionFeedback error={error} />
      </span>
      {canRevoke && (
        <Button variant="outline" isPending={isPending} pendingLabel={text.revoking} onClick={() => void run()}>
          {text.revoke}
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
  const { m } = useI18n()
  const { teamInvitations: text, invite, roles: roleLabels, roleDescriptions } = m.calendars
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
      ? m.calendars.validation.alreadyMember
      : undefined
    const errors = validateInvitation(invitation, invitations, ownEmail, m)
    const message = memberError ?? errors.email
    setFieldError(message)
    setSentTo(null)
    if (!message) void send.run(invitation)
  }

  return (
    <PageSection title={text.title} description={text.description}>
      <Form
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <div className="formRow inviteRow">
          <EmailTextField
            label={invite.email}
            name="inviteEmail"
            value={email}
            error={fieldError}
            onChange={(value) => {
              setEmail(value)
              setFieldError(undefined)
            }}
          />
          <SelectField
            label={invite.role}
            name="inviteRole"
            value={role}
            options={roles.map((value) => ({ value, label: roleLabels[value] }))}
            onChange={setRole}
          />
          <Button type="submit" className="inviteAdd" isPending={send.isPending} pendingLabel={text.sending}>
            {text.submit}
          </Button>
        </div>
        <p className="formHint">{m.calendars.roleHint(roleLabels[role], roleDescriptions[role])}</p>
        <ActionFeedback error={send.error} success={sentTo && text.sent(sentTo)} />
      </Form>

      <ErrorMessage message={error} />
      <ItemList items={invitations} empty={text.none}>
        {(invitation) => (
          <InvitationRow
            key={invitation.id}
            invitation={invitation}
            canRevoke={outranks(calendar.role, invitation.role)}
            onRevoke={() => onRevoke(invitation.id)}
          />
        )}
      </ItemList>
    </PageSection>
  )
}
