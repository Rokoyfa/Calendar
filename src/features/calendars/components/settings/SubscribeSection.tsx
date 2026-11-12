import { useCallback, useState } from 'react'
import { Button } from '../../../../components/Button.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { ActionFeedback } from '../../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../../hooks/useAsyncAction.ts'
import { useAsyncResource } from '../../../../hooks/useAsyncResource.ts'
import { useI18n } from '../../../../i18n/index.ts'
import { isApiError } from '../../../../utils/apiError.ts'
import { useCalendars } from '../../hooks/useCalendars.ts'
import type { CalendarRepository, CalendarSummary } from '../../types/calendar.ts'

type FeedRepository = Required<Pick<CalendarRepository, 'getFeed' | 'createFeed' | 'deleteFeed'>>

type FeedState = { supported: boolean; url: string | null }

const UNKNOWN: FeedState = { supported: false, url: null }

const toWebcal = (url: string) => url.replace(/^https?:/, 'webcal:')

const hasFeeds = (repository: CalendarRepository): repository is CalendarRepository & FeedRepository =>
  Boolean(repository.getFeed && repository.createFeed && repository.deleteFeed)

export function SubscribeSection({ calendar }: { calendar: CalendarSummary }) {
  const { repository } = useCalendars()
  return hasFeeds(repository) ? <FeedSection calendar={calendar} repository={repository} /> : null
}

function FeedSection({ calendar, repository }: { calendar: CalendarSummary; repository: FeedRepository }) {
  const { m } = useI18n()
  const { feed } = m.calendars
  const [current, setCurrent] = useState<FeedState | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(
    () =>
      repository
        .getFeed(calendar.id)
        .then((url): FeedState => ({ supported: true, url }))
        .catch((error: unknown) => {
          if (isApiError(error) && error.isNotFound) return UNKNOWN
          throw error
        }),
    [repository, calendar.id],
  )
  const { data: loaded, error: loadError, isLoading } = useAsyncResource(load, UNKNOWN)
  const state = current ?? loaded

  const create = useAsyncAction(async () => {
    setCopied(false)
    setCurrent({ supported: true, url: await repository.createFeed(calendar.id) })
  })
  const remove = useAsyncAction(async () => {
    setCopied(false)
    await repository.deleteFeed(calendar.id)
    setCurrent({ supported: true, url: null })
  })

  const copy = async () => {
    if (!state.url) return
    await navigator.clipboard.writeText(state.url)
    setCopied(true)
  }

  if (isLoading || !state.supported) return null

  return (
    <PageSection title={feed.title} description={feed.description}>
      {state.url ? (
        <>
          <label className="field">
            <span className="descriptor">{feed.label}</span>
            <input className="input feedUrl" readOnly value={state.url} onFocus={(event) => event.target.select()} />
          </label>
          <div className="buttonRow">
            <Button variant="outline" onClick={() => void copy()}>
              {copied ? feed.copied : feed.copy}
            </Button>
            <a className="button button--outline" href={toWebcal(state.url)}>
              {feed.openApp}
            </a>
          </div>
          <p className="formHint">{feed.warning}</p>
          <div className="buttonRow">
            <Button variant="outline" isPending={create.isPending} onClick={() => void create.run()}>
              {feed.renew}
            </Button>
            <Button variant="danger" isPending={remove.isPending} onClick={() => void remove.run()}>
              {feed.remove}
            </Button>
          </div>
        </>
      ) : (
        <div className="buttonRow">
          <Button isPending={create.isPending} onClick={() => void create.run()}>
            {feed.create}
          </Button>
        </div>
      )}
      <ActionFeedback error={loadError ?? create.error ?? remove.error} />
    </PageSection>
  )
}
