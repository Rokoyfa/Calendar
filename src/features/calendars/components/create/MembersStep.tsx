import { useState } from 'react'
import { Button } from '../../../../components/Button.tsx'
import { IconButton } from '../../../../components/IconButton.tsx'
import { SelectField } from '../../../../components/SelectField.tsx'
import { TextField } from '../../../../components/TextField.tsx'
import { normalizeEmail, EMAIL_MAX_LENGTH } from '../../../../utils/validation.ts'
import { DEFAULT_INVITATION_ROLE, INVITABLE_ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS } from '../../constants/calendars.ts'
import type { InvitableRole, Invitation } from '../../types/calendar.ts'
import { validateInvitation } from '../../utils/draft.ts'

const ROLE_OPTIONS = INVITABLE_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }))

type MembersStepProps = {
  invitations: readonly Invitation[]
  ownEmail: string | null
  onChange: (invitations: Invitation[]) => void
}

export function MembersStep({ invitations, ownEmail, onChange }: MembersStepProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InvitableRole>(DEFAULT_INVITATION_ROLE)
  const [error, setError] = useState<string>()

  const add = () => {
    const invitation = { email: normalizeEmail(email), role }
    const errors = validateInvitation(invitation, invitations, ownEmail)
    setError(errors.email)
    if (errors.email) return
    onChange([...invitations, invitation])
    setEmail('')
  }

  return (
    <>
      <div className="formRow inviteRow">
        <TextField
          label="E-Mail-Adresse"
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
        <SelectField label="Rolle" name="inviteRole" value={role} options={ROLE_OPTIONS} onChange={setRole} />
        <Button variant="outline" className="inviteAdd" onClick={add}>
          Hinzufügen
        </Button>
      </div>
      <p className="formHint">
        {ROLE_LABELS[role]}: {ROLE_DESCRIPTIONS[role]}
      </p>

      {invitations.length === 0 ? (
        <p className="emptyHint">Noch niemand eingeladen. Das geht auch später noch.</p>
      ) : (
        <ul className="itemList">
          {invitations.map((invitation) => (
            <li key={invitation.email} className="itemRow">
              <span className="itemRowMain">
                <span className="itemRowTitle">{invitation.email}</span>
                <span className="itemRowMeta">{ROLE_LABELS[invitation.role]}</span>
              </span>
              <IconButton
                label={`${invitation.email} entfernen`}
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
