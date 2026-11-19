import { useCallback, useState } from 'react'
import { Button } from '../../../../components/Button.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { ErrorMessage } from '../../../../components/StatusMessage.tsx'
import { useViewerTimeZone } from '../../../../context/TimeZoneContext.ts'
import { useAsyncAction } from '../../../../hooks/useAsyncAction.ts'
import { useAsyncResource } from '../../../../hooks/useAsyncResource.ts'
import { useI18n } from '../../../../i18n/index.ts'
import { formatTimestamp } from '../../../../utils/timestamp.ts'
import { useAuth } from '../../hooks/useAuth.ts'
import type { SecurityActions, UserSession } from '../../types/auth.ts'
import { describeUserAgent } from '../../utils/twoFactor.ts'

const NO_SESSIONS: UserSession[] = []

export function SessionsSection({ security }: { security: SecurityActions }) {
  const { m, locale } = useI18n()
  const text = m.security.sessions
  const timeZone = useViewerTimeZone()
  const { expireSession } = useAuth()
  const load = useCallback(() => security.listSessions(), [security])
  const { data: sessions, error, isLoading, reload } = useAsyncResource(load, NO_SESSIONS)
  const [endingId, setEndingId] = useState<string | null>(null)

  const endOne = useAsyncAction(async (session: UserSession) => {
    setEndingId(session.id)
    try {
      await security.endSession(session.id)
    } finally {
      setEndingId(null)
    }
    if (session.current) expireSession()
    else reload()
  })

  const endOthers = useAsyncAction(async () => {
    await security.endOtherSessions()
    reload()
  })

  const others = sessions.filter((session) => !session.current)
  const time = (iso: string) => formatTimestamp(iso, locale, timeZone)

  return (
    <PageSection title={text.title} description={text.description}>
      <ErrorMessage message={error ?? endOne.error ?? endOthers.error} />
      {isLoading && sessions.length === 0 ? (
        <p className="formHint">{m.common.loading}</p>
      ) : (
        <ul className="sessionList">
          {sessions.map((session) => (
            <li key={session.id} className="sessionItem">
              <div className="sessionInfo">
                <span className="sessionDevice">
                  {describeUserAgent(session.userAgent) ?? text.unknownDevice}
                  {session.current && <span className="statusBadge statusBadge--on">{text.current}</span>}
                </span>
                <span className="formHint">
                  {[text.lastSeen(time(session.lastSeenAt)), text.signedIn(time(session.createdAt)), session.ipAddress]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
              <Button
                variant="outline"
                isPending={endingId === session.id}
                pendingLabel={text.ending}
                disabled={endingId !== null}
                onClick={() => void endOne.run(session)}
              >
                {session.current ? text.endCurrent : text.endOne}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {others.length > 0 && (
        <div className="buttonRow">
          <Button
            variant="dangerOutline"
            isPending={endOthers.isPending}
            pendingLabel={text.ending}
            onClick={() => void endOthers.run()}
          >
            {text.endOthers}
          </Button>
        </div>
      )}
    </PageSection>
  )
}
