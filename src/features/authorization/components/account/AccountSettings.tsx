import { useAuth } from '../../hooks/useAuth.ts'
import { DeleteAccountSection } from './DeleteAccountSection.tsx'
import { EmailSection } from './EmailSection.tsx'
import { PasswordSection } from './PasswordSection.tsx'
import { ProfileSection } from './ProfileSection.tsx'

export function AccountSettings() {
  const { enabled, user } = useAuth()
  if (!enabled || !user) return null

  return (
    <>
      <ProfileSection user={user} />
      <EmailSection user={user} />
      <PasswordSection />
      <DeleteAccountSection />
    </>
  )
}
