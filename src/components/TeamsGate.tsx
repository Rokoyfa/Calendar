import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { ROUTES } from '../config/routes.ts'
import { useHost } from '../context/HostContext.ts'

export function TeamsGate({ children }: { children: ReactNode }) {
  const { teams } = useHost()
  return teams ? children : <Navigate to={ROUTES.settings} replace />
}
