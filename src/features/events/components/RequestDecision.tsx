import { Button } from '../../../components/Button.tsx'
import { ActionFeedback } from '../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useI18n } from '../../../i18n/index.ts'

export type RequestDecisionOptions = {
  requester: string | null
  onAccept: () => Promise<void>
  onDecline: () => Promise<void>
}

export function RequestDecision({ requester, onAccept, onDecline }: RequestDecisionOptions) {
  const { m } = useI18n()
  const text = m.peers.decision
  const accept = useAsyncAction(onAccept)
  const decline = useAsyncAction(onDecline)
  const isBusy = accept.isPending || decline.isPending

  return (
    <div className="requestDecision" role="group" aria-label={requester ? text.by(requester) : text.unknown}>
      <p>{requester ? text.by(requester) : text.unknown}</p>
      <ActionFeedback error={accept.error ?? decline.error} />
      <div className="buttonRow">
        <Button
          variant="outline"
          disabled={isBusy}
          isPending={decline.isPending}
          pendingLabel={text.declining}
          onClick={() => void decline.run()}
        >
          {text.decline}
        </Button>
        <Button
          disabled={isBusy}
          isPending={accept.isPending}
          pendingLabel={text.accepting}
          onClick={() => void accept.run()}
        >
          {text.accept}
        </Button>
      </div>
    </div>
  )
}
