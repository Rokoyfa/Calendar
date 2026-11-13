import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { ROUTES } from '../config/routes.ts'
import { useFeatures } from '../context/HostContext.ts'

export function TeamsGate({ children }: { children: ReactNode }) {
  const { teams } = useFeatures()
  return teams ? children : <Navigate to={ROUTES.settings} replace />
}
