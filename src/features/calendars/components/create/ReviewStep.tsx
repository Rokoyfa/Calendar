import { ROLE_LABELS } from '../../constants/calendars.ts'
import type { CalendarDraft } from '../../types/calendar.ts'
import { CalendarPreview } from '../CalendarPreview.tsx'

export function ReviewStep({ draft }: { draft: CalendarDraft }) {
  return (
    <div className="wizardSplit">
      <dl className="summaryList">
        <dt>Name</dt>
        <dd>{draft.name.trim()}</dd>
        <dt>Beschreibung</dt>
        <dd>{draft.description.trim() || '–'}</dd>
        <dt>Deine Rolle</dt>
        <dd>{ROLE_LABELS.owner}</dd>
        <dt>Einladungen</dt>
        <dd>
          {draft.invitations.length === 0 ? (
            'Keine'
          ) : (
            <ul className="summaryInvitations">
              {draft.invitations.map((invitation) => (
                <li key={invitation.email}>
                  {invitation.email} <span className="itemRowMeta">· {ROLE_LABELS[invitation.role]}</span>
                </li>
              ))}
            </ul>
          )}
        </dd>
      </dl>
      <CalendarPreview color={draft.color} />
    </div>
  )
}
