import { ExternalLinkIcon } from '../../../components/Icons.tsx'
import { Button } from '../../../components/Button.tsx'
import { useI18n } from '../../../i18n/index.ts'
import {
  EVENT_LINK_LABEL_MAX_LENGTH,
  EVENT_LINK_URL_MAX_LENGTH,
  getLinkName,
  isWebUrl,
  MAX_EVENT_LINKS,
  normalizeLinkUrl,
  type EventLink,
} from '../../../utils/event.ts'

type LinksFieldProps = {
  links: readonly EventLink[]
  error?: string
  onChange: (links: EventLink[]) => void
}

export function LinksField({ links, error, onChange }: LinksFieldProps) {
  const { m } = useI18n()
  const rows = links.length > 0 ? links : [{ url: '', label: '' }]

  const update = (index: number, changes: Partial<EventLink>) =>
    onChange(rows.map((link, current) => (current === index ? { ...link, ...changes } : link)))

  const remove = (index: number) => onChange(rows.filter((_, current) => current !== index))

  return (
    <fieldset className="field links">
      <legend className="descriptor">{m.events.links}</legend>
      <ul className="linkList">
        {rows.map((link, index) => {
          const url = normalizeLinkUrl(link.url)
          const valid = isWebUrl(url)
          const name = valid ? getLinkName({ url, label: link.label.trim() }) : String(index + 1)
          return (
            <li key={index} className="linkRow">
              <input
                className="input linkUrl"
                type="url"
                inputMode="url"
                name={`linkUrl${index}`}
                autoComplete="off"
                placeholder="https://…"
                aria-label={m.events.linkUrl}
                aria-invalid={Boolean(error) && !valid}
                maxLength={EVENT_LINK_URL_MAX_LENGTH}
                value={link.url}
                onChange={(event) => update(index, { url: event.target.value })}
              />
              <input
                className="input linkLabel"
                name={`linkLabel${index}`}
                autoComplete="off"
                placeholder={m.events.linkLabel}
                aria-label={m.events.linkLabel}
                maxLength={EVENT_LINK_LABEL_MAX_LENGTH}
                value={link.label}
                onChange={(event) => update(index, { label: event.target.value })}
              />
              <span className="linkActions">
                {valid ? (
                  <a
                    className="iconButton iconButton--plain"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={m.events.openLink(name)}
                    title={m.events.openLink(name)}
                  >
                    <ExternalLinkIcon size={18} />
                  </a>
                ) : (
                  <span className="iconButton iconButton--plain linkPlaceholder" aria-hidden="true">
                    <ExternalLinkIcon size={18} />
                  </span>
                )}
                <button
                  type="button"
                  className="closeButton"
                  aria-label={m.events.removeLink(name)}
                  title={m.events.removeLink(name)}
                  disabled={links.length === 0}
                  onClick={() => remove(index)}
                >
                  ×
                </button>
              </span>
            </li>
          )
        })}
      </ul>
      {error && <span className="errorText">{error}</span>}
      {rows.length < MAX_EVENT_LINKS && rows.every(({ url }) => url.trim() !== '') && (
        <div className="buttonRow">
          <Button variant="secondary" onClick={() => onChange([...rows, { url: '', label: '' }])}>
            {m.events.addLink}
          </Button>
        </div>
      )}
    </fieldset>
  )
}
