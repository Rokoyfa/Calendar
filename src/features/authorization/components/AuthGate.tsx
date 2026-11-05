import type { ReactNode } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { getRedirectTarget, ROUTES } from '../../../config/routes.ts'
import { useAuth } from '../hooks/useAuth.ts'

type AuthGateProps = {
  access: 'guest' | 'any' | 'user'
  children: ReactNode
}

export function AuthGate({ access, children }: AuthGateProps) {
  const { enabled, user } = useAuth()
  const [searchParams] = useSearchParams()

  if (access === 'user') return enabled && !user ? <Navigate to={ROUTES.calendar} replace /> : children
  if (!enabled) return <Navigate to={ROUTES.calendar} replace />
  if (access === 'guest' && user) return <Navigate to={getRedirectTarget(searchParams)} replace />
  return children
}
