import { Button } from '../../../components/Button.tsx'
import { ActionFeedback } from '../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useAuth } from '../hooks/useAuth.ts'

export function ResendVerificationButton({ label, className }: { label: string; className?: string }) {
  const { resendVerificationEmail } = useAuth()
  const { run, isPending, isSuccess, error } = useAsyncAction(resendVerificationEmail)

  if (isSuccess) return <ActionFeedback error={null} success="E-Mail wurde erneut gesendet." />

  return (
    <>
      <Button
        variant="outline"
        className={className}
        isPending={isPending}
        pendingLabel="Wird gesendet …"
        onClick={() => void run()}
      >
        {label}
      </Button>
      <ActionFeedback error={error} />
    </>
  )
}
