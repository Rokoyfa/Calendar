import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router'
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
  const { user, verifyEmail } = useAuth()
  const [searchParams] = useSearchParams()
  const token = searchParams.get(TOKEN_PARAM)
  const load = useCallback(async () => (token ? verifyOnce(token, verifyEmail) : false), [token, verifyEmail])
  const { data: isVerified, error, isLoading } = useAsyncResource(load, false)

  if (token && isLoading)
    return (
      <PageLayout title="E-Mail bestätigen">
        <p className="formHint">E-Mail-Adresse wird bestätigt …</p>
      </PageLayout>
    )

  return (
    <PageLayout title="E-Mail bestätigen">
      <ActionFeedback
        error={token ? error : 'Dieser Link ist unvollständig.'}
        success={isVerified && 'Deine E-Mail-Adresse ist bestätigt.'}
      />
      <ContinueLink />
      {error && user && (
        <p className="formHint">
          Einen neuen Link kannst du in den <Link to={ROUTES.settings}>Einstellungen</Link> anfordern.
        </p>
      )}
    </PageLayout>
  )
}
