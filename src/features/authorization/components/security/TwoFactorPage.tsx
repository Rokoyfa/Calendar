import { useCallback } from 'react'
import { Navigate } from 'react-router'
import { useFeatures } from '../../../../context/HostContext.ts'
import { PageLayout } from '../../../../components/PageLayout.tsx'
import { ErrorMessage } from '../../../../components/StatusMessage.tsx'
import { ROUTES, SETTINGS_SECURITY_PATH } from '../../../../config/routes.ts'
import { useAsyncResource } from '../../../../hooks/useAsyncResource.ts'
import { useI18n } from '../../../../i18n/index.ts'
import { useAuth } from '../../hooks/useAuth.ts'
import type { TwoFactorState } from '../../types/auth.ts'
import { TwoFactorManage } from './TwoFactorManage.tsx'
import { TwoFactorSetup } from './TwoFactorSetup.tsx'

const UNKNOWN: TwoFactorState | null = null

export function TwoFactorPage() {
  const { m } = useI18n()
  const text = m.security.twoFactor
  const { twoFactor } = useFeatures()
  const { security, method, refreshUser } = useAuth()
  const load = useCallback(async () => (security ? security.getTwoFactorState() : UNKNOWN), [security])
  const { data: state, error, isLoading, reload } = useAsyncResource(load, UNKNOWN)

  const changed = useCallback(async () => {
    reload()
    await refreshUser()
  }, [reload, refreshUser])

  if (!twoFactor || !security || method !== 'password') return <Navigate to={ROUTES.settings} replace />

  return (
    <PageLayout title={text.pageTitle} variant="full" back={{ to: SETTINGS_SECURITY_PATH, label: text.backToSettings }}>
      <p className="formHint pageIntro">{text.intro}</p>
      <ErrorMessage message={error} />
      {isLoading && !state ? (
        <p className="formHint">{m.common.loading}</p>
      ) : state && !state.available ? (
        <p className="formHint">{text.unavailable}</p>
      ) : state?.enabled ? (
        <TwoFactorManage security={security} state={state} onChanged={changed} />
      ) : state ? (
        <TwoFactorSetup security={security} onEnabled={changed} />
      ) : null}
    </PageLayout>
  )
}
