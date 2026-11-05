import { ButtonLink } from '../../../components/Button.tsx'
import { ROUTES } from '../../../config/routes.ts'
import { useAuth } from '../hooks/useAuth.ts'

export function ContinueLink() {
  const { user } = useAuth()
  return (
    <ButtonLink to={user ? ROUTES.calendar : ROUTES.login} block>
      {user ? 'Zum Kalender' : 'Jetzt anmelden'}
    </ButtonLink>
  )
}
