import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../../../components/Button.tsx'
import { ConfirmModal } from '../../../../components/ConfirmModal.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { SETTINGS_CALENDARS_PATH } from '../../../../config/routes.ts'
import { useCalendars } from '../../hooks/useCalendars.ts'
import type { CalendarSummary, TeamMember } from '../../types/calendar.ts'
import { hasPermission } from '../../utils/permissions.ts'

type Action = 'leave' | 'delete'

export function DangerSection({ calendar, members }: { calendar: CalendarSummary; members: readonly TeamMember[] }) {
  const { leaveCalendar, deleteTeam } = useCalendars()
  const navigate = useNavigate()
  const [action, setAction] = useState<Action | null>(null)
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
      <div className="dangerAction">
        <p className="formHint">
          {isLastOwner
            ? 'Als einziger Owner kannst du nicht austreten. Mache vorher ein anderes Mitglied zum Owner oder lösche das Team.'
            : 'Du siehst den Kalender danach nicht mehr. Zurück geht es nur über eine neue Einladung.'}
        </p>
        <Button variant="outline" disabled={isLastOwner} onClick={() => setAction('leave')}>
          Kalender verlassen
        </Button>
      </div>
      {canDelete && (
        <div className="dangerAction">
          <p className="formHint">
            Löscht das Team „{teamName}“ mit allen Kalendern, Terminen und Einladungen für alle Mitglieder.
          </p>
          <Button variant="danger" onClick={() => setAction('delete')}>
            Team löschen
          </Button>
        </div>
      )}

      {action === 'leave' && (
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
      {action === 'delete' && (
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
