import type { ReactNode } from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router'
import { getRedirectTarget, ROUTES, withRedirect } from '../../../config/routes.ts'
import { useAuth } from '../hooks/useAuth.ts'

type AuthGateProps = {
  access: 'guest' | 'any' | 'user'
  children: ReactNode
}

export function AuthGate({ access, children }: AuthGateProps) {
  const { enabled, user } = useAuth()
  const [searchParams] = useSearchParams()
  const location = useLocation()

  if (access === 'user') {
    if (enabled && !user) return <Navigate to={withRedirect(ROUTES.login, location.pathname)} replace />
    return children
  }

  if (!enabled) return <Navigate to={ROUTES.calendar} replace />
  if (access === 'guest' && user) return <Navigate to={getRedirectTarget(searchParams)} replace />
  return children
}
