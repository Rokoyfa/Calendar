import { useState } from 'react'
import { Button } from '../../../../components/Button.tsx'
import { SelectField } from '../../../../components/SelectField.tsx'
import { EmailTextField } from '../../../../components/TextField.tsx'
import { normalizeEmail } from '../../../../utils/validation.ts'
import { useI18n } from '../../../../i18n/index.ts'
import { DEFAULT_INVITATION_ROLE, INVITABLE_ROLES } from '../../constants/calendars.ts'
import type { InvitableRole, Invitation } from '../../types/calendar.ts'
import { validateInvitation } from '../../utils/draft.ts'
import { ItemList } from '../../../../components/ItemList.tsx'
import { RemoveButton } from '../../../../components/RemoveButton.tsx'

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
        <EmailTextField
          label={invite.email}
          name="inviteEmail"
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

      <ItemList items={invitations} empty={invite.nobodyYet}>
        {(invitation) => (
          <li key={invitation.email} className="itemRow">
            <span className="itemRowMain">
              <span className="itemRowTitle">{invitation.email}</span>
              <span className="itemRowMeta">{roles[invitation.role]}</span>
            </span>
            <RemoveButton
              label={invite.remove(invitation.email)}
              onClick={() => onChange(invitations.filter((entry) => entry.email !== invitation.email))}
            />
          </li>
        )}
      </ItemList>
    </>
  )
}
