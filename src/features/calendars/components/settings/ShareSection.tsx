import { useCallback, useState } from 'react'
import { Button } from '../../../../components/Button.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { ActionFeedback } from '../../../../components/StatusMessage.tsx'
import { useHost } from '../../../../context/HostContext.ts'
import { useAsyncAction } from '../../../../hooks/useAsyncAction.ts'
import { useAsyncResource } from '../../../../hooks/useAsyncResource.ts'
import { useI18n } from '../../../../i18n/index.ts'
import { isApiError } from '../../../../utils/apiError.ts'
import { buildSharedLink, getSharedPath } from '../../../../utils/sharedCalendar.ts'
import { useCalendars } from '../../hooks/useCalendars.ts'
import type { CalendarRepository, CalendarSummary } from '../../types/calendar.ts'

type ShareRepository = Required<Pick<CalendarRepository, 'getShare' | 'createShare' | 'deleteShare'>>

type ShareState = { supported: boolean; token: string | null }

const UNKNOWN: ShareState = { supported: false, token: null }

const canShare = (repository: CalendarRepository): repository is CalendarRepository & ShareRepository =>
  Boolean(repository.getShare && repository.createShare && repository.deleteShare)

export function ShareSection({ calendar }: { calendar: CalendarSummary }) {
  const { repository } = useCalendars()
  return canShare(repository) ? <PublicLink calendar={calendar} repository={repository} /> : null
}

function PublicLink({ calendar, repository }: { calendar: CalendarSummary; repository: ShareRepository }) {
  const { m } = useI18n()
  const { share } = m.calendars
  const { links } = useHost()
  const [current, setCurrent] = useState<ShareState | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(
    () =>
      repository
        .getShare(calendar.id)
        .then((token): ShareState => ({ supported: true, token }))
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
    setCurrent({ supported: true, token: await repository.createShare(calendar.id) })
  })
  const remove = useAsyncAction(async () => {
    setCopied(false)
    await repository.deleteShare(calendar.id)
    setCurrent({ supported: true, token: null })
  })

  if (isLoading || !state.supported) return null

  const url = state.token ? buildSharedLink(state.token, links, window.location.href) : null
  const value = state.token ? (url ?? getSharedPath(state.token)) : ''

  const copy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
  }

  return (
    <PageSection title={share.title} description={share.description}>
      {state.token ? (
        <>
          <label className="field">
            <span className="descriptor">{url ? share.label : share.pathLabel}</span>
            <input className="input feedUrl" readOnly value={value} onFocus={(event) => event.target.select()} />
          </label>
          <div className="buttonRow">
            <Button variant="outline" onClick={() => void copy()}>
              {copied ? share.copied : share.copy}
            </Button>
            {url && (
              <a className="button button--outline" href={url} target="_blank" rel="noopener noreferrer">
                {share.open}
              </a>
            )}
          </div>
          <p className="formHint">{share.warning}</p>
          <div className="buttonRow">
            <Button variant="outline" isPending={create.isPending} onClick={() => void create.run()}>
              {share.renew}
            </Button>
            <Button variant="danger" isPending={remove.isPending} onClick={() => void remove.run()}>
              {share.remove}
            </Button>
          </div>
        </>
      ) : (
        <div className="buttonRow">
          <Button isPending={create.isPending} onClick={() => void create.run()}>
            {share.create}
          </Button>
        </div>
      )}
      <ActionFeedback error={loadError ?? create.error ?? remove.error} />
    </PageSection>
  )
}
