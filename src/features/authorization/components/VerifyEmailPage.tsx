import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useI18n } from '../../../i18n/index.ts'
import { PageLayout } from '../../../components/PageLayout.tsx'
import { ActionFeedback } from '../../../components/StatusMessage.tsx'
import { ROUTES, TOKEN_PARAM } from '../../../config/routes.ts'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { ContinueLink } from './ContinueLink.tsx'

const verifications = new Map<string, Promise<boolean>>()

const verifyOnce = (token: string, verify: (token: string) => Promise<void>) => {
  let verification = verifications.get(token)
  if (!verification) {
    verification = verify(token).then(() => true)
    verifications.set(token, verification)
  }
  return verification
}

export function VerifyEmailPage() {
  const { m } = useI18n()
  const { user, verifyEmail } = useAuth()
  const [searchParams] = useSearchParams()
  const token = searchParams.get(TOKEN_PARAM)
  const load = useCallback(async () => (token ? verifyOnce(token, verifyEmail) : false), [token, verifyEmail])
  const { data: isVerified, error, isLoading } = useAsyncResource(load, false)

  if (token && isLoading)
    return (
      <PageLayout title={m.auth.verify.title}>
        <p className="formHint">{m.auth.verify.verifying}</p>
      </PageLayout>
    )

  return (
    <PageLayout title={m.auth.verify.title}>
      <ActionFeedback
        error={token ? error : m.auth.verify.incompleteLink}
        success={isVerified && m.auth.verify.success}
      />
      <ContinueLink />
      {error && user && (
        <p className="formHint">
          {m.auth.verify.newLinkBefore}
          <Link to={ROUTES.settings}>{m.auth.verify.newLinkSettings}</Link>
          {m.auth.verify.newLinkAfter}
        </p>
      )}
    </PageLayout>
  )
}
