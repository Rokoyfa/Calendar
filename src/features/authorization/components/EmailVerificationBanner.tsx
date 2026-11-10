import { useI18n } from '../../../i18n/index.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { ResendVerificationButton } from './ResendVerificationButton.tsx'

export function EmailVerificationBanner() {
  const { m } = useI18n()
  const { method, user } = useAuth()
  if (!user || user.emailVerified || method !== 'password') return null

  return (
    <div className="banner" role="region" aria-label={m.auth.verify.bannerLabel}>
      <p>
        {m.auth.verify.bannerBefore}
        <strong>{user.email}</strong>
        {m.auth.verify.bannerAfter}
      </p>
      <ResendVerificationButton label={m.auth.verify.resend} className="bannerAction" />
    </div>
  )
}
