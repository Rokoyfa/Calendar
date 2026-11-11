import { useRootElement } from '../../../../context/RootElementContext.ts'
import { useI18n } from '../../../../i18n/index.ts'
import { isCompactWidth } from '../../../../utils/preferences.ts'
import { TEAM_ROLES } from '../../types/calendar.ts'

export function RoleOverview() {
  const { m } = useI18n()
  const root = useRootElement()
  const { roles, roleDescriptions, roleOverview } = m.calendars

  return (
    <details className="roleOverview" open={!isCompactWidth(root.clientWidth)}>
      <summary className="roleOverviewTitle">{roleOverview}</summary>
      <ul className="roleOverviewList">
        {TEAM_ROLES.map((role) => (
          <li key={role}>
            <span className="roleOverviewName">{roles[role]}</span>
            <span className="roleOverviewText">{roleDescriptions[role]}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}
