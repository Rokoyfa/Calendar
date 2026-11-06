import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../../../components/Button.tsx'
import { ConfirmModal } from '../../../../components/ConfirmModal.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { SETTINGS_CALENDARS_PATH } from '../../../../config/routes.ts'
import { ROLE_LABELS } from '../../constants/calendars.ts'
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
    <PageSection title="Gefahrenbereich" tone="danger">
      {isOwner && (
        <div className="dangerAction">
          <p className="formHint">
            {candidates.length > 0
              ? 'Ein anderes Mitglied wird Owner, du wirst Administrator. Zurück geht es nur, wenn der neue Owner dir die Rolle wieder gibt.'
              : 'Zum Übertragen braucht das Team ein weiteres Mitglied, das noch nicht Owner ist.'}
          </p>
          <Button variant="outline" disabled={candidates.length === 0} onClick={() => setAction({ type: 'transfer' })}>
            Leitung übertragen
          </Button>
        </div>
      )}
      <div className="dangerAction">
        <p className="formHint">
          {isLastOwner
            ? 'Als einziger Owner kannst du nicht austreten. Übertrage vorher die Leitung oder lösche das Team.'
            : 'Du siehst den Kalender danach nicht mehr. Zurück geht es nur über eine neue Einladung.'}
        </p>
        <Button variant="outline" disabled={isLastOwner} onClick={() => setAction({ type: 'leave' })}>
          Kalender verlassen
        </Button>
      </div>
      {canDelete && (
        <div className="dangerAction">
          <p className="formHint">
            Löscht das Team „{teamName}“ mit allen Kalendern, Terminen und Einladungen für alle Mitglieder.
          </p>
          <Button variant="danger" onClick={() => setAction({ type: 'delete' })}>
            Team löschen
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
          title="Leitung wirklich übertragen?"
          confirmLabel="Endgültig übertragen"
          pendingLabel="Wird übertragen …"
          onConfirm={async () => {
            await transferOwnership(calendar, action.member.userId)
            onOwnershipTransferred()
            setAction(null)
          }}
          onClose={() => setAction(null)}
        >
          {action.member.name} ({action.member.email}) wird Owner von „{teamName}“ und bekommt alle Rechte, auch zum
          Löschen des Teams. Du wirst {ROLE_LABELS.admin} und kannst das Team danach nicht mehr löschen oder die Leitung
          selbst zurückholen.
        </ConfirmModal>
      )}
      {action?.type === 'leave' && (
        <ConfirmModal
          title="Kalender verlassen?"
          confirmLabel="Verlassen"
          pendingLabel="Wird verlassen …"
          onConfirm={() => finish(() => leaveCalendar(calendar.id))}
          onClose={() => setAction(null)}
        >
          Du verlässt das Team „{teamName}“ und siehst seinen Kalender nicht mehr. Zurück geht es nur über eine neue
          Einladung.
        </ConfirmModal>
      )}
      {action?.type === 'delete' && (
        <ConfirmModal
          title="Team löschen?"
          confirmLabel="Endgültig löschen"
          pendingLabel="Wird gelöscht …"
          onConfirm={() => finish(() => deleteTeam(calendar))}
          onClose={() => setAction(null)}
        >
          „{teamName}“ wird mit allen Kalendern, Terminen und Einladungen gelöscht, auch für alle {members.length}{' '}
          Mitglieder. Das kann nicht rückgängig gemacht werden.
        </ConfirmModal>
      )}
    </PageSection>
  )
}
