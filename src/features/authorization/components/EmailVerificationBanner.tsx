import { ErrorMessage, StatusMessage } from '../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useAuth } from '../hooks/useAuth.ts'

export function EmailVerificationBanner() {
  const { user, resendVerificationEmail } = useAuth()
  const { run, isPending, isSuccess, error } = useAsyncAction(resendVerificationEmail)

  if (!user || user.emailVerified) return null

  return (
    <div className="banner" role="region" aria-label="E-Mail-Bestätigung">
      <p>
        Bitte bestätige deine E-Mail-Adresse <strong>{user.email}</strong> über den Link in unserer E-Mail.
      </p>
      {isSuccess ? (
        <StatusMessage tone="success" message="E-Mail wurde erneut gesendet." />
      ) : (
        <button type="button" className="button button--outline bannerAction" disabled={isPending} onClick={() => void run()}>
          {isPending ? 'Wird gesendet …' : 'Erneut senden'}
        </button>
      )}
      <ErrorMessage message={error} />
    </div>
  )
}
