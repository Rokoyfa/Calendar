import { useCallback } from 'react'
import { ButtonLink } from '../../../../components/Button.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { ROUTES } from '../../../../config/routes.ts'
import { useFeatures } from '../../../../context/HostContext.ts'
import { useAsyncResource } from '../../../../hooks/useAsyncResource.ts'
import { useI18n } from '../../../../i18n/index.ts'
import { useAuth } from '../../hooks/useAuth.ts'
import type { SecurityActions, TwoFactorState } from '../../types/auth.ts'
import { SessionsSection } from './SessionsSection.tsx'

const UNKNOWN: TwoFactorState | null = null

function TwoFactorSummary({ security }: { security: SecurityActions }) {
  const { m } = useI18n()
  const text = m.security.twoFactor
  const load = useCallback(() => security.getTwoFactorState(), [security])
  const { data: state } = useAsyncResource<TwoFactorState | null>(load, UNKNOWN)

  if (state && !state.available) return null
  return (
    <PageSection title={text.title} description={text.description}>
      <div className="buttonRow buttonRow--center">
        {state && (
          <span className={state.enabled ? 'statusBadge statusBadge--on' : 'statusBadge'}>
            {state.enabled ? text.statusOn(state.recoveryCodesLeft) : text.off}
          </span>
        )}
        <ButtonLink to={ROUTES.twoFactor} variant="outline">
          {state?.enabled ? text.manage : text.setUp}
        </ButtonLink>
      </div>
    </PageSection>
  )
}

export function SecuritySettings() {
  const { twoFactor } = useFeatures()
  const { security, user } = useAuth()
  if (!security || !user) return null
  return (
    <>
      {twoFactor && user.hasPassword !== false && <TwoFactorSummary security={security} />}
      <SessionsSection security={security} />
    </>
  )
}
