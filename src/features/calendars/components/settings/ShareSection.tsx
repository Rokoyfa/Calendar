import { useMemo } from 'react'
import { useHost } from '../../../../context/HostContext.ts'
import { useI18n } from '../../../../i18n/index.ts'
import { buildSharedLink, getSharedPath } from '../../utils/sharedCalendar.ts'
import { useCalendars } from '../../hooks/useCalendars.ts'
import { useSecretLink, type SecretLinkOperations } from '../../hooks/useSecretLink.ts'
import type { CalendarRepository, CalendarSummary } from '../../types/calendar.ts'
import { SecretLinkSection } from './SecretLinkSection.tsx'

type ShareRepository = Required<Pick<CalendarRepository, 'getShare' | 'createShare' | 'deleteShare'>>

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
  const operations = useMemo<SecretLinkOperations>(
    () => ({
      get: (id) => repository.getShare(id),
      create: (id) => repository.createShare(id),
      remove: (id) => repository.deleteShare(id),
    }),
    [repository],
  )
  const link = useSecretLink(calendar.id, operations)
  const token = link.value
  const url = token ? buildSharedLink(token, links, window.location.href) : null

  return (
    <SecretLinkSection
      texts={share}
      link={link}
      field={token ? { label: url ? share.label : share.pathLabel, value: url ?? getSharedPath(token) } : null}
      openAction={
        url && (
          <a className="button button--outline" href={url} target="_blank" rel="noopener noreferrer">
            {share.open}
          </a>
        )
      }
    />
  )
}
