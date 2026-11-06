import { useState } from 'react'
import { Button } from '../../../../components/Button.tsx'
import { ConfirmModal } from '../../../../components/ConfirmModal.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { ActionFeedback, ErrorMessage } from '../../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../../hooks/useAsyncAction.ts'
import { useI18n } from '../../../../i18n/index.ts'
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
  const { m } = useI18n()
  const { members: text, roles: roleLabels } = m.calendars
  const { run, isPending, error } = useAsyncAction(onChangeRole)
  const options = roles.includes(member.role) ? roles : [member.role, ...roles]

  return (
    <li className="itemRow memberRow">
      <span className="itemRowMain">
        <span className="itemRowTitle">
          {member.name}
          {isSelf && text.you}
        </span>
        <span className="itemRowMeta">{member.email}</span>
        <ActionFeedback error={error} />
      </span>
      {canManage ? (
        <>
          <select
            className="input memberRole"
            aria-label={text.roleOf(member.name)}
            value={member.role}
            disabled={isPending}
            onChange={(event) => void run(event.target.value as TeamRole)}
          >
            {options.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={onRemove}>
            {text.remove}
          </Button>
        </>
      ) : (
        <span className="badge">{roleLabels[member.role]}</span>
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
  const { m } = useI18n()
  const { members: text } = m.calendars
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null)
  const canManageMembers = hasPermission(calendar, 'manage_members')
  const roles = getAssignableRoles(calendar.role)

  return (
    <PageSection
      title={text.title}
      description={text.description}
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
          title={text.removeTitle}
          confirmLabel={text.remove}
          pendingLabel={text.removing}
          onConfirm={async () => {
            await onRemove(memberToRemove.userId)
            setMemberToRemove(null)
          }}
          onClose={() => setMemberToRemove(null)}
        >
          {text.removeMessage(memberToRemove.name, calendar.name)}
        </ConfirmModal>
      )}
    </PageSection>
  )
}
