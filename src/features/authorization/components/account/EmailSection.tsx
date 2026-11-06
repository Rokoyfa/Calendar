import { useI18n } from '../../../../i18n/index.ts'
import { PageSection } from '../../../../components/PageSection.tsx'
import type { User } from '../../types/auth.ts'
import { ResendVerificationButton } from '../ResendVerificationButton.tsx'

export function EmailSection({ user }: { user: User }) {
  const { m } = useI18n()
  return (
    <PageSection title={m.auth.account.emailTitle}>
      <p className="settingValue">
        {user.email}
        <span className={user.emailVerified ? 'badge badge--success' : 'badge'}>
          {user.emailVerified ? m.auth.account.verified : m.auth.account.unverified}
        </span>
      </p>
      {!user.emailVerified && (
        <>
          <p className="formHint">{m.auth.account.verificationSent}</p>
          <div className="formActions">
            <ResendVerificationButton label={m.auth.account.resendVerification} />
          </div>
        </>
      )}
    </PageSection>
  )
}
