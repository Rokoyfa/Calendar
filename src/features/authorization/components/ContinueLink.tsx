import { useI18n } from '../../../i18n/index.ts'
import { ButtonLink } from '../../../components/Button.tsx'
import { ROUTES } from '../../../config/routes.ts'
import { useAuth } from '../hooks/useAuth.ts'

export function ContinueLink() {
  const { m } = useI18n()
  const { user } = useAuth()
  return (
    <ButtonLink to={user ? ROUTES.calendar : ROUTES.login} block>
      {user ? m.auth.continueToCalendar : m.auth.signInNow}
    </ButtonLink>
  )
}
