import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PageLayout } from '../../../components/PageLayout.tsx'
import { ErrorMessage, StatusMessage } from '../../../components/StatusMessage.tsx'
import { ROUTES, TOKEN_PARAM } from '../../../config/routes.ts'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import { useAuth } from '../hooks/useAuth.ts'

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

  const renderStatus = () => {
    if (!token) return <ErrorMessage message="Dieser Link ist unvollständig." />
    if (isLoading) return <p className="formHint">E-Mail-Adresse wird bestätigt …</p>
    if (error) return <ErrorMessage message={error} />
    if (isVerified) return <StatusMessage tone="success" message="Deine E-Mail-Adresse ist bestätigt." />
    return null
  }

  return (
    <PageLayout title="E-Mail bestätigen">
      {renderStatus()}
      {!isLoading && (
        <Link to={user ? ROUTES.calendar : ROUTES.login} className="button button--block">
          {user ? 'Zum Kalender' : 'Anmelden'}
        </Link>
      )}
      {!isLoading && error && user && (
        <p className="formHint">
          Einen neuen Link kannst du in den <Link to={ROUTES.settings}>Einstellungen</Link> anfordern.
        </p>
      )}
    </PageLayout>
  )
}
