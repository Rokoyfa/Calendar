import { useState } from 'react'
import { Button } from '../../../../components/Button.tsx'
import { IconButton } from '../../../../components/IconButton.tsx'
import { SelectField } from '../../../../components/SelectField.tsx'
import { TextField } from '../../../../components/TextField.tsx'
import { normalizeEmail, EMAIL_MAX_LENGTH } from '../../../../utils/validation.ts'
import { useI18n } from '../../../../i18n/index.ts'
import { DEFAULT_INVITATION_ROLE, INVITABLE_ROLES } from '../../constants/calendars.ts'
import type { InvitableRole, Invitation } from '../../types/calendar.ts'
import { validateInvitation } from '../../utils/draft.ts'

type MembersStepProps = {
  invitations: readonly Invitation[]
  ownEmail: string | null
  onChange: (invitations: Invitation[]) => void
}

export function MembersStep({ invitations, ownEmail, onChange }: MembersStepProps) {
  const { m } = useI18n()
  const { invite, roles, roleDescriptions } = m.calendars
  const roleOptions = INVITABLE_ROLES.map((value) => ({ value, label: roles[value] }))
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InvitableRole>(DEFAULT_INVITATION_ROLE)
  const [error, setError] = useState<string>()

  const add = () => {
    const invitation = { email: normalizeEmail(email), role }
    const errors = validateInvitation(invitation, invitations, ownEmail, m)
    setError(errors.email)
    if (errors.email) return
    onChange([...invitations, invitation])
    setEmail('')
  }

  return (
    <>
      <div className="formRow inviteRow">
        <TextField
          label={invite.email}
          name="inviteEmail"
          type="email"
          inputMode="email"
          autoComplete="off"
          maxLength={EMAIL_MAX_LENGTH}
          value={email}
          error={error}
          onChange={(value) => {
            setEmail(value)
            setError(undefined)
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            event.preventDefault()
            add()
          }}
        />
        <SelectField label={invite.role} name="inviteRole" value={role} options={roleOptions} onChange={setRole} />
        <Button variant="outline" className="inviteAdd" onClick={add}>
          {invite.add}
        </Button>
      </div>
      <p className="formHint">{m.calendars.roleHint(roles[role], roleDescriptions[role])}</p>

      {invitations.length === 0 ? (
        <p className="emptyHint">{invite.nobodyYet}</p>
      ) : (
        <ul className="itemList">
          {invitations.map((invitation) => (
            <li key={invitation.email} className="itemRow">
              <span className="itemRowMain">
                <span className="itemRowTitle">{invitation.email}</span>
                <span className="itemRowMeta">{roles[invitation.role]}</span>
              </span>
              <IconButton
                label={invite.remove(invitation.email)}
                plain
                onClick={() => onChange(invitations.filter((entry) => entry.email !== invitation.email))}
              >
                ×
              </IconButton>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
