import { ExternalLink } from '../../../components/ExternalLink.tsx'
import { MapPinIcon } from '../../../components/Icons.tsx'
import { useLocationUrl } from '../../../hooks/useLocationUrl.ts'
import { useI18n } from '../../../i18n/index.ts'

export function EventLocation({ location }: { location: string }) {
  const { m } = useI18n()
  const url = useLocationUrl()(location)
  if (!url) return <span className="eventLocation">{location}</span>
  return (
    <ExternalLink
      className="eventLink eventLocationLink"
      href={url}
      title={m.events.openMap(location)}
      aria-label={m.events.openMap(location)}
    >
      <MapPinIcon size={11} />
      {location}
    </ExternalLink>
  )
}
