import { Link, useLocation } from 'react-router'
import { ROUTES, withRedirect } from '../../../config/routes.ts'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { ErrorMessage } from '../../../components/ErrorMessage.tsx'

const ACCOUNT_POPOVER_ID = 'accountMenu'

const getInitial = (name: string) => name.trim().charAt(0).toUpperCase() || '?'

export function AccountMenu() {
  const { enabled, status, user, logout } = useAuth()
  const location = useLocation()
  const { run, isPending, error } = useAsyncAction(logout)

  if (!enabled || status === 'loading') return null

  if (!user)
    return (
      <Link
        to={withRedirect(ROUTES.login, location.pathname + location.search)}
        className="button button--outline accountLogin"
      >
        Anmelden
      </Link>
    )

  return (
    <>
      <button
        type="button"
        className="accountButton"
        popoverTarget={ACCOUNT_POPOVER_ID}
        aria-label={`Konto von ${user.name}`}
        title={user.name}
      >
        {getInitial(user.name)}
      </button>
      <div id={ACCOUNT_POPOVER_ID} popover="auto" className="accountPopover surface">
        <p className="accountName">{user.name}</p>
        <p className="accountEmail">{user.email}</p>
        <ErrorMessage message={error} />
        <button
          type="button"
          className="button button--secondary button--block"
          disabled={isPending}
          onClick={() => void run()}
        >
          {isPending ? 'Wird abgemeldet …' : 'Abmelden'}
        </button>
      </div>
    </>
  )
}
