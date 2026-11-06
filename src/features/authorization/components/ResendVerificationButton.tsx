import { useI18n } from '../../../i18n/index.ts'
import { Button } from '../../../components/Button.tsx'
import { ActionFeedback } from '../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useAuth } from '../hooks/useAuth.ts'

export function ResendVerificationButton({ label, className }: { label: string; className?: string }) {
  const { m } = useI18n()
  const { resendVerificationEmail } = useAuth()
  const { run, isPending, isSuccess, error } = useAsyncAction(resendVerificationEmail)

  if (isSuccess) return <ActionFeedback error={null} success={m.auth.verify.resent} />

  return (
    <>
      <Button
        variant="outline"
        className={className}
        isPending={isPending}
        pendingLabel={m.auth.verify.sending}
        onClick={() => void run()}
      >
        {label}
      </Button>
      <ActionFeedback error={error} />
    </>
  )
}
