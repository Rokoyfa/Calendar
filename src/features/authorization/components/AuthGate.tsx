import type { ReactNode } from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router'
import { getRedirectTarget, ROUTES, withRedirect } from '../../../config/routes.ts'
import { useAuth } from '../hooks/useAuth.ts'

type AuthGateProps = {
  access: 'guest' | 'any' | 'user' | 'account'
  children: ReactNode
}

export function AuthGate({ access, children }: AuthGateProps) {
  const { enabled, method, user } = useAuth()
  const [searchParams] = useSearchParams()
  const location = useLocation()

  const usesPassword = method === 'password'
  if (access === 'user') return enabled && usesPassword && !user ? <Navigate to={ROUTES.calendar} replace /> : children
  if (!enabled) return <Navigate to={ROUTES.calendar} replace />
  if (access === 'guest' && !usesPassword) return <Navigate to={ROUTES.calendar} replace />
  if (access === 'account' && !user)
    return <Navigate to={usesPassword ? withRedirect(ROUTES.login, location.pathname) : ROUTES.calendar} replace />
  if (access === 'guest' && user) return <Navigate to={getRedirectTarget(searchParams)} replace />
  return children
}
