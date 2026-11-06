import { useI18n } from '../../../../i18n/index.ts'
import type { CalendarDraft } from '../../types/calendar.ts'
import { CalendarPreview } from '../CalendarPreview.tsx'

export function ReviewStep({ draft }: { draft: CalendarDraft }) {
  const { m } = useI18n()
  const { details, roles } = m.calendars
  return (
    <div className="wizardSplit">
      <dl className="summaryList">
        <dt>{details.name}</dt>
        <dd>{draft.name.trim()}</dd>
        <dt>{details.description}</dt>
        <dd>{draft.description.trim() || '–'}</dd>
        <dt>{details.yourRole}</dt>
        <dd>{roles.owner}</dd>
        <dt>{details.invitations}</dt>
        <dd>
          {draft.invitations.length === 0 ? (
            details.none
          ) : (
            <ul className="summaryInvitations">
              {draft.invitations.map((invitation) => (
                <li key={invitation.email}>
                  {invitation.email} <span className="itemRowMeta">· {roles[invitation.role]}</span>
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
