import { PageSection } from '../../../../components/PageSection.tsx'
import { ErrorMessage, StatusMessage } from '../../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../../hooks/useAsyncAction.ts'
import { useAuth } from '../../hooks/useAuth.ts'
import type { User } from '../../types/auth.ts'

export function EmailSection({ user }: { user: User }) {
  const { resendVerificationEmail } = useAuth()
  const { run, isPending, isSuccess, error } = useAsyncAction(resendVerificationEmail)

  return (
    <PageSection title="E-Mail-Adresse">
      <p className="settingValue">
        {user.email}
        <span className={user.emailVerified ? 'badge badge--success' : 'badge'}>
          {user.emailVerified ? 'Bestätigt' : 'Nicht bestätigt'}
        </span>
      </p>
      {!user.emailVerified && (
        <>
          <p className="formHint">Wir haben dir einen Bestätigungslink geschickt. Nichts angekommen?</p>
          <ErrorMessage message={error} />
          {isSuccess ? (
            <StatusMessage tone="success" message="E-Mail wurde erneut gesendet." />
          ) : (
            <div className="formActions">
              <button type="button" className="button button--outline" disabled={isPending} onClick={() => void run()}>
                {isPending ? 'Wird gesendet …' : 'Bestätigungslink erneut senden'}
              </button>
            </div>
          )}
        </>
      )}
    </PageSection>
  )
}
