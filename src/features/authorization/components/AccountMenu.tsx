import type { MouseEvent, ReactNode, ToggleEvent } from 'react'
import { useLocation } from 'react-router'
import { Button, ButtonLink } from '../../../components/Button.tsx'
import { ROUTES, withRedirect } from '../../../config/routes.ts'
import { useI18n } from '../../../i18n/index.ts'
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

const POPOVER_GAP_PX = 8

const placeBelowTrigger = (event: ToggleEvent<HTMLDivElement>) => {
  if (event.newState !== 'open') return
  const menu = event.currentTarget
  const trigger = (menu.getRootNode() as Document | ShadowRoot).querySelector<HTMLElement>(
    `[popovertarget="${menu.id}"]`,
  )
  if (!trigger) return
  const { bottom, right } = trigger.getBoundingClientRect()
  menu.style.top = `${bottom + POPOVER_GAP_PX}px`
  menu.style.right = `${Math.max(document.documentElement.clientWidth - right, POPOVER_GAP_PX)}px`
}

type AccountMenuProps = {
  menuItems?: ReactNode
}

export function AccountMenu({ menuItems }: AccountMenuProps) {
  const { m } = useI18n()
  const { enabled, method, status, user, logout } = useAuth()
  const location = useLocation()
  const { run, isPending, error } = useAsyncAction(logout)

  if (!enabled || status === 'loading') return null

  if (!user && method === 'hostToken') return null

  if (!user)
    return (
      <ButtonLink
        to={withRedirect(ROUTES.login, location.pathname + location.search)}
        variant="outline"
        className="accountLogin"
      >
        {m.auth.menu.signIn}
      </ButtonLink>
    )

  return (
    <>
      <button
        type="button"
        className="accountButton"
        popoverTarget={ACCOUNT_POPOVER_ID}
        aria-label={m.auth.menu.accountOf(user.name)}
        title={user.name}
      >
        {getInitial(user.name)}
      </button>
      <div
        id={ACCOUNT_POPOVER_ID}
        popover="auto"
        className="accountPopover surface"
        onBeforeToggle={placeBelowTrigger}
        onClick={closeOnAction}
      >
        <p className="accountName">{user.name}</p>
        <p className="accountEmail">{user.email}</p>
        <ErrorMessage message={error} />
        {menuItems}
        <ButtonLink to={ROUTES.settings} variant="outline" block>
          {m.common.settings}
        </ButtonLink>
        {method === 'password' && (
          <Button
            variant="secondary"
            block
            isPending={isPending}
            pendingLabel={m.auth.menu.signingOut}
            onClick={() => void run()}
          >
            {m.auth.menu.signOut}
          </Button>
        )}
      </div>
    </>
  )
}
