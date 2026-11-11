import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { getRedirectTarget } from '../../../config/routes.ts'

export function useRedirectTarget() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = getRedirectTarget(searchParams)
  const continueToTarget = useCallback(() => navigate(redirectTo, { replace: true }), [navigate, redirectTo])
  return { redirectTo, continueToTarget }
}
