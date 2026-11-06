import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../../../components/Button.tsx'
import { ConfirmModal } from '../../../../components/ConfirmModal.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { SETTINGS_CALENDARS_PATH } from '../../../../config/routes.ts'
import { useI18n } from '../../../../i18n/index.ts'
import { useCalendars } from '../../hooks/useCalendars.ts'
import type { CalendarSummary, TeamMember } from '../../types/calendar.ts'
import { hasPermission } from '../../utils/permissions.ts'
import { TransferOwnershipModal } from './TransferOwnershipModal.tsx'

type Action = { type: 'leave' | 'delete' | 'transfer' } | { type: 'confirmTransfer'; member: TeamMember }

type DangerSectionProps = {
  calendar: CalendarSummary
  members: readonly TeamMember[]
  currentUserId: string | null
  onOwnershipTransferred: () => void
}

export function DangerSection({ calendar, members, currentUserId, onOwnershipTransferred }: DangerSectionProps) {
  const { m } = useI18n()
  const { danger, leave, roles } = m.calendars
  const { leaveCalendar, deleteTeam, transferOwnership } = useCalendars()
  const navigate = useNavigate()
  const [action, setAction] = useState<Action | null>(null)
  const isOwner = calendar.role === 'owner'
  const candidates = members.filter((member) => member.userId !== currentUserId && member.role !== 'owner')
  const owners = members.filter((member) => member.role === 'owner').length
  const isLastOwner = calendar.role === 'owner' && owners <= 1
  const canDelete = hasPermission(calendar, 'delete_team')
  const teamName = calendar.teamName ?? calendar.name

  const finish = async (operation: () => Promise<void>) => {
    await operation()
    await navigate(SETTINGS_CALENDARS_PATH, { replace: true })
  }

  return (
    <PageSection title={danger.title} tone="danger">
      {isOwner && (
        <div className="dangerAction">
          <p className="formHint">
            {candidates.length > 0 ? danger.transferHint : danger.transferUnavailable}
          </p>
          <Button variant="outline" disabled={candidates.length === 0} onClick={() => setAction({ type: 'transfer' })}>
            {danger.transfer}
          </Button>
        </div>
      )}
      <div className="dangerAction">
        <p className="formHint">
          {isLastOwner ? danger.lastOwnerHint : danger.leaveHint}
        </p>
        <Button variant="outline" disabled={isLastOwner} onClick={() => setAction({ type: 'leave' })}>
          {m.calendars.list.leave}
        </Button>
      </div>
      {canDelete && (
        <div className="dangerAction">
          <p className="formHint">{danger.deleteHint(teamName)}</p>
          <Button variant="danger" onClick={() => setAction({ type: 'delete' })}>
            {danger.deleteTeam}
          </Button>
        </div>
      )}

      {action?.type === 'transfer' && (
        <TransferOwnershipModal
          candidates={candidates}
          onSelect={(member) => setAction({ type: 'confirmTransfer', member })}
          onClose={() => setAction(null)}
        />
      )}
      {action?.type === 'confirmTransfer' && (
        <ConfirmModal
          title={danger.transferConfirmTitle}
          confirmLabel={danger.transferConfirm}
          pendingLabel={danger.transferring}
          onConfirm={async () => {
            await transferOwnership(calendar, action.member.userId)
            onOwnershipTransferred()
            setAction(null)
          }}
          onClose={() => setAction(null)}
        >
          {danger.transferMessage(action.member.name, action.member.email, teamName, roles.admin)}
        </ConfirmModal>
      )}
      {action?.type === 'leave' && (
        <ConfirmModal
          title={leave.title}
          confirmLabel={leave.confirm}
          pendingLabel={leave.pending}
          onConfirm={() => finish(() => leaveCalendar(calendar.id))}
          onClose={() => setAction(null)}
        >
          {leave.message(teamName)}
        </ConfirmModal>
      )}
      {action?.type === 'delete' && (
        <ConfirmModal
          title={danger.deleteTitle}
          confirmLabel={danger.deleteConfirm}
          pendingLabel={danger.deleting}
          onConfirm={() => finish(() => deleteTeam(calendar))}
          onClose={() => setAction(null)}
        >
          {danger.deleteMessage(teamName, members.length)}
        </ConfirmModal>
      )}
    </PageSection>
  )
}
