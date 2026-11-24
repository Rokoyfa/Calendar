import { DecisionButtons } from '../../../components/DecisionButtons.tsx'
import { useI18n } from '../../../i18n/index.ts'

export type RequestDecisionOptions = {
  requester: string | null
  onAccept: () => Promise<void>
  onDecline: () => Promise<void>
}

export function RequestDecision({ requester, onAccept, onDecline }: RequestDecisionOptions) {
  const { m } = useI18n()
  const text = m.peers.decision
  const label = requester ? text.by(requester) : text.unknown

  return (
    <div className="requestDecision" role="group" aria-label={label}>
      <p>{label}</p>
      <DecisionButtons labels={text} onAccept={onAccept} onDecline={onDecline} className="buttonRow" />
    </div>
  )
}
