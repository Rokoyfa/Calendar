import { GlobeIcon } from '../../../components/Icons.tsx'
import { useI18n } from '../../../i18n/index.ts'
import { getLinkName, type EventLink } from '../../../utils/event.ts'

type EventLinksProps = {
  links: readonly EventLink[]
  lines: number
}

export function EventLinks({ links, lines }: EventLinksProps) {
  const { m } = useI18n()
  if (lines < 1 || links.length === 0) return null
  const visible = links.slice(0, lines)
  const hidden = links.length - visible.length

  return (
    <span className="eventLinks">
      {visible.map((link, index) => {
        const name = getLinkName(link)
        return (
          <span key={link.url} className="eventLinkRow">
            <a
              className="eventLink"
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              title={link.label ? `${link.label}\n${link.url}` : link.url}
              aria-label={m.events.openLink(name)}
            >
              <GlobeIcon size={11} />
              {name}
            </a>
            {hidden > 0 && index === visible.length - 1 && (
              <span className="eventMoreLinks" title={m.calendar.moreLinks(hidden)}>
                +{hidden}
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}
