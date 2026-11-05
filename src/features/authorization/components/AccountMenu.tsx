import type { MouseEvent, ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { ROUTES, withRedirect } from '../../../config/routes.ts'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'

const ACCOUNT_POPOVER_ID = 'accountMenu'

const getInitial = (name: string) => name.trim().charAt(0).toUpperCase() || '?'

const closeOnAction = (event: MouseEvent<HTMLDivElement>) => {
  const menu = event.currentTarget
  if (menu.matches(':popover-open') && event.target instanceof Element && event.target.closest('a, button'))
    menu.hidePopover()
}

type AccountMenuProps = {
  menuItems?: ReactNode
}

export function AccountMenu({ menuItems }: AccountMenuProps) {
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
      <div id={ACCOUNT_POPOVER_ID} popover="auto" className="accountPopover surface" onClick={closeOnAction}>
        <p className="accountName">{user.name}</p>
        <p className="accountEmail">{user.email}</p>
        <ErrorMessage message={error} />
        {menuItems}
        <Link to={ROUTES.settings} className="button button--outline button--block">
          Einstellungen
        </Link>
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
