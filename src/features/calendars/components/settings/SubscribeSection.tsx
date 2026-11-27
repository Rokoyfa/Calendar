import { useMemo } from 'react'
import { AnchorButton } from '../../../../components/Button.tsx'
import { useI18n } from '../../../../i18n/index.ts'
import { useCalendars } from '../../hooks/useCalendars.ts'
import { useSecretLink, type SecretLinkOperations } from '../../hooks/useSecretLink.ts'
import type { CalendarRepository, CalendarSummary } from '../../types/calendar.ts'
import { SecretLinkSection } from './SecretLinkSection.tsx'

type FeedRepository = Required<Pick<CalendarRepository, 'getFeed' | 'createFeed' | 'deleteFeed'>>

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
  const operations = useMemo<SecretLinkOperations>(
    () => ({
      get: (id) => repository.getFeed(id),
      create: (id) => repository.createFeed(id),
      remove: (id) => repository.deleteFeed(id),
    }),
    [repository],
  )
  const link = useSecretLink(calendar.id, operations)
  const url = link.value

  return (
    <SecretLinkSection
      texts={feed}
      link={link}
      field={url ? { label: feed.label, value: url } : null}
      openAction={
        url && (
          <AnchorButton variant="outline" href={toWebcal(url)}>
            {feed.openApp}
          </AnchorButton>
        )
      }
    />
  )
}
