import type { ReactNode } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { getRedirectTarget } from '../../../config/routes.ts'
import { useAuth } from '../hooks/useAuth.ts'

type GuestOnlyProps = {
  children: ReactNode
}

export function GuestOnly({ children }: GuestOnlyProps) {
  const { enabled, user } = useAuth()
  const [searchParams] = useSearchParams()
  if (!enabled || user) return <Navigate to={getRedirectTarget(searchParams)} replace />
  return children
}
