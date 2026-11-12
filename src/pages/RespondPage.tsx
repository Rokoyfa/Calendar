import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ButtonLink } from '../components/Button.tsx'
import { PageLayout } from '../components/PageLayout.tsx'
import { SegmentedField } from '../components/SegmentedField.tsx'
import { ActionFeedback } from '../components/StatusMessage.tsx'
import { ROUTES, TOKEN_PARAM } from '../config/routes.ts'
import { useViewerTimeZone } from '../context/TimeZoneContext.ts'
import { useAuth } from '../features/authorization/index.ts'
import { useAsyncAction } from '../hooks/useAsyncAction.ts'
import { useAsyncResource } from '../hooks/useAsyncResource.ts'
import { useLocationUrl } from '../hooks/useLocationUrl.ts'
import { useI18n } from '../i18n/index.ts'
import { isOneOf } from '../utils/object.ts'
import { formatEventPeriod, toViewerPeriod, type EventReply, type EventResponse } from '../utils/event.ts'

const REPLIES = ['accepted', 'tentative', 'declined'] as const satisfies readonly EventReply[]
const STATUS_PARAM = 'status'

const answers = new Map<string, Promise<EventResponse>>()

const answerOnce = (
  token: string,
  status: EventReply,
  respond: (token: string, status: EventReply) => Promise<EventResponse>,
) => {
  const key = `${token}:${status}`
  let answer = answers.get(key)
  if (!answer) {
    answer = respond(token, status)
    answers.set(key, answer)
    answer.catch(() => answers.delete(key))
  }
  return answer
}

export function RespondPage() {
  const i18n = useI18n()
  const { m } = i18n
  const { respondPage } = m.events
  const { respondToEvent } = useAuth()
  const viewerTimeZone = useViewerTimeZone()
  const getLocationUrl = useLocationUrl()
  const [searchParams] = useSearchParams()
  const token = searchParams.get(TOKEN_PARAM)
  const requested = searchParams.get(STATUS_PARAM)
  const initialStatus = isOneOf(REPLIES, requested) ? requested : null
  const [changed, setChanged] = useState<EventResponse | null>(null)

  const load = useCallback(
    async () => (token && initialStatus ? answerOnce(token, initialStatus, respondToEvent) : null),
    [token, initialStatus, respondToEvent],
  )
  const { data: answered, error, isLoading } = useAsyncResource(load, null)
  const change = useAsyncAction(async (status: EventReply) => {
    if (token) setChanged(await respondToEvent(token, status))
  })
  const response = changed ?? answered

  if (!token || !initialStatus)
    return (
      <PageLayout title={respondPage.title}>
        <ActionFeedback error={respondPage.incompleteLink} />
      </PageLayout>
    )

  if (isLoading || !response)
    return (
      <PageLayout title={respondPage.title}>
        {isLoading ? <p className="formHint">{respondPage.sending}</p> : <ActionFeedback error={error} />}
      </PageLayout>
    )

  const period = { ...toViewerPeriod(response, response.timeZone, viewerTimeZone), allDay: response.allDay }
  const status = isOneOf(REPLIES, response.status) ? response.status : null

  return (
    <PageLayout title={respondPage.title}>
      <div className="respondEvent">
        <h2 className="respondTitle">{response.title}</h2>
        <p>
          {response.allDay || response.startDate === response.endDate
            ? `${i18n.format.longDate(period.startDate)}, ${formatEventPeriod(period, i18n)}`
            : formatEventPeriod(period, i18n)}
        </p>
        {response.location && (
          <p>
            <a href={getLocationUrl(response.location) ?? undefined} target="_blank" rel="noopener noreferrer">
              {response.location}
            </a>
          </p>
        )}
        {response.recurring && <p className="formHint">{respondPage.recurring}</p>}
      </div>
      <SegmentedField
        label={m.events.yourResponse}
        value={status ?? 'accepted'}
        options={REPLIES.map((reply) => ({ value: reply, label: m.events.respond[reply] }))}
        onChange={(reply) => void change.run(reply)}
      />
      <ActionFeedback
        error={change.error}
        success={status && !change.isPending && respondPage.saved(m.events.attendeeStatus[status])}
      />
      <ButtonLink to={ROUTES.calendar} block>
        {m.auth.continueToCalendar}
      </ButtonLink>
    </PageLayout>
  )
}
