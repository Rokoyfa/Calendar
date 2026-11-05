import { useState } from 'react'
import { Button } from '../../../../components/Button.tsx'
import { ConfirmModal } from '../../../../components/ConfirmModal.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { ActionFeedback, ErrorMessage } from '../../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../../hooks/useAsyncAction.ts'
import { ROLE_LABELS } from '../../constants/calendars.ts'
import type { CalendarSummary, TeamMember, TeamRole } from '../../types/calendar.ts'
import { getAssignableRoles, hasPermission, outranks } from '../../utils/permissions.ts'

type MembersSectionProps = {
  calendar: CalendarSummary
  members: readonly TeamMember[]
  error: string | null
  currentUserId: string | null
  onChangeRole: (userId: string, role: TeamRole) => Promise<void>
  onRemove: (userId: string) => Promise<void>
}

type MemberRowProps = {
  member: TeamMember
  isSelf: boolean
  canManage: boolean
  roles: readonly TeamRole[]
  onChangeRole: (role: TeamRole) => Promise<void>
  onRemove: () => void
}

function MemberRow({ member, isSelf, canManage, roles, onChangeRole, onRemove }: MemberRowProps) {
  const { run, isPending, error } = useAsyncAction(onChangeRole)
  const options = roles.includes(member.role) ? roles : [member.role, ...roles]

  return (
    <li className="itemRow memberRow">
      <span className="itemRowMain">
        <span className="itemRowTitle">
          {member.name}
          {isSelf && ' (du)'}
        </span>
        <span className="itemRowMeta">{member.email}</span>
        <ActionFeedback error={error} />
      </span>
      {canManage ? (
        <>
          <select
            className="input memberRole"
            aria-label={`Rolle von ${member.name}`}
            value={member.role}
            disabled={isPending}
            onChange={(event) => void run(event.target.value as TeamRole)}
          >
            {options.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={onRemove}>
            Entfernen
          </Button>
        </>
      ) : (
        <span className="badge">{ROLE_LABELS[member.role]}</span>
      )}
    </li>
  )
}

export function MembersSection({
  calendar,
  members,
  error,
  currentUserId,
  onChangeRole,
  onRemove,
}: MembersSectionProps) {
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null)
  const canManageMembers = hasPermission(calendar, 'manage_members')
  const roles = getAssignableRoles(calendar.role)

  return (
    <PageSection
      title="Mitglieder"
      description="Alle, die diesen Kalender sehen. Rollen ändern und Mitglieder entfernen dürfen Owner und Administratoren, und zwar nur bei Rollen unterhalb der eigenen."
    >
      <ErrorMessage message={error} />
      <ul className="itemList">
        {members.map((member) => {
          const isSelf = member.userId === currentUserId
          return (
            <MemberRow
              key={member.userId}
              member={member}
              isSelf={isSelf}
              canManage={canManageMembers && !isSelf && outranks(calendar.role, member.role)}
              roles={roles}
              onChangeRole={(role) => onChangeRole(member.userId, role)}
              onRemove={() => setMemberToRemove(member)}
            />
          )
        })}
      </ul>
      {memberToRemove && (
        <ConfirmModal
          title="Mitglied entfernen?"
          confirmLabel="Entfernen"
          pendingLabel="Wird entfernt …"
          onConfirm={async () => {
            await onRemove(memberToRemove.userId)
            setMemberToRemove(null)
          }}
          onClose={() => setMemberToRemove(null)}
        >
          {memberToRemove.name} sieht „{calendar.name}“ danach nicht mehr. Zurück geht es nur über eine neue Einladung.
        </ConfirmModal>
      )}
    </PageSection>
  )
}
