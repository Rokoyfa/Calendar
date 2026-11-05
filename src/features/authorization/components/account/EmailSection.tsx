import { PageSection } from '../../../../components/PageSection.tsx'
import type { User } from '../../types/auth.ts'
import { ResendVerificationButton } from '../ResendVerificationButton.tsx'

export function EmailSection({ user }: { user: User }) {
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
          <div className="formActions">
            <ResendVerificationButton label="Bestätigungslink erneut senden" />
          </div>
        </>
      )}
    </PageSection>
  )
}
