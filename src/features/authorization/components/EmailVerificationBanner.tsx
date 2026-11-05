import { useAuth } from '../hooks/useAuth.ts'
import { ResendVerificationButton } from './ResendVerificationButton.tsx'

export function EmailVerificationBanner() {
  const { user } = useAuth()
  if (!user || user.emailVerified) return null

  return (
    <div className="banner" role="region" aria-label="E-Mail-Bestätigung">
      <p>
        Bitte bestätige deine E-Mail-Adresse <strong>{user.email}</strong> über den Link in unserer E-Mail.
      </p>
      <ResendVerificationButton label="Erneut senden" className="bannerAction" />
    </div>
  )
}
