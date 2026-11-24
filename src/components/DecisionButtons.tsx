import { useAsyncAction } from '../hooks/useAsyncAction.ts'
import { Button } from './Button.tsx'
import { ActionFeedback } from './StatusMessage.tsx'

export type DecisionLabels = {
  accept: string
  accepting: string
  decline: string
  declining: string
}

type DecisionButtonsProps = {
  labels: DecisionLabels
  onAccept: () => Promise<void>
  onDecline: () => Promise<void>
  className?: string
}

export function DecisionButtons({ labels, onAccept, onDecline, className = 'formActions' }: DecisionButtonsProps) {
  const accept = useAsyncAction(onAccept)
  const decline = useAsyncAction(onDecline)
  const isBusy = accept.isPending || decline.isPending

  return (
    <>
      <ActionFeedback error={accept.error ?? decline.error} />
      <div className={className}>
        <Button
          variant="outline"
          disabled={isBusy}
          isPending={decline.isPending}
          pendingLabel={labels.declining}
          onClick={() => void decline.run()}
        >
          {labels.decline}
        </Button>
        <Button
          disabled={isBusy}
          isPending={accept.isPending}
          pendingLabel={labels.accepting}
          onClick={() => void accept.run()}
        >
          {labels.accept}
        </Button>
      </div>
    </>
  )
}
