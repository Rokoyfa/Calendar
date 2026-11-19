import { useState } from 'react'
import { Button } from '../../../components/Button.tsx'
import { ConfirmModal } from '../../../components/ConfirmModal.tsx'
import { Form } from '../../../components/Form.tsx'
import { PageSection } from '../../../components/PageSection.tsx'
import { ActionFeedback, ErrorMessage } from '../../../components/StatusMessage.tsx'
import { Switch } from '../../../components/Switch.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { useViewerTimeZone } from '../../../context/TimeZoneContext.ts'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useForm } from '../../../hooks/useForm.ts'
import { useI18n } from '../../../i18n/index.ts'
import { isErrorCode } from '../../../utils/appError.ts'
import { getEventColorAttributes, type EventColor } from '../../../utils/event.ts'
import {
  EXTERNAL_CALENDAR_NAME_MAX_LENGTH,
  EXTERNAL_CALENDAR_URL_MAX_LENGTH,
  isCalendarUrl,
  MAX_EXTERNAL_CALENDARS,
  normalizeCalendarUrl,
  type ExternalCalendar,
} from '../../../utils/externalCalendar.ts'
import { formatTimestamp } from '../../../utils/timestamp.ts'
import { ColorPicker } from '../../events/index.ts'
import { useExternalCalendars } from '../hooks/useExternalCalendars.ts'

type AddValues = { name: string; url: string; color: EventColor }

const EMPTY: AddValues = { name: '', url: '', color: 'blue' }

function ExternalCalendarRow({ calendar, onRemove }: { calendar: ExternalCalendar; onRemove: () => void }) {
  const { m, locale } = useI18n()
  const text = m.external
  const timeZone = useViewerTimeZone()
  const { update, failedIds } = useExternalCalendars()
  const [isEditing, setIsEditing] = useState(false)
  const toggle = useAsyncAction((shown: boolean) => update(calendar.id, { shown }))
  const edit = useForm({
    initialValues: { name: calendar.name, color: calendar.color },
    validate: ({ name }) => (name.trim() ? {} : { name: text.nameRequired }),
    onSubmit: async ({ name, color }) => {
      await update(calendar.id, { name: name.trim(), color })
      setIsEditing(false)
    },
  })
  const error = calendar.error && isErrorCode(calendar.error) ? calendar.error : null
  const failed = failedIds.has(calendar.id) || error !== null

  return (
    <li className="calendarSettingCard">
      <div className="calendarSettingHeader">
        <span {...getEventColorAttributes(calendar.color, 'colorSwatch colorSwatch--large')} aria-hidden="true" />
        <span className="itemRowMain">
          <span className="itemRowTitle">{calendar.name}</span>
          <span className="itemRowMeta">{calendar.urlHost}</span>
          {calendar.fetchedAt && (
            <span className="itemRowMeta">{text.updated(formatTimestamp(calendar.fetchedAt, locale, timeZone))}</span>
          )}
        </span>
        <span className="badge">{text.readOnly}</span>
      </div>
      <div className="calendarSettingBody">
        {failed && <ErrorMessage message={m.errors[error ?? 'externalCalendarUnavailable']} />}
        <Switch
          label={text.show}
          checked={calendar.shown}
          disabled={toggle.isPending}
          onChange={(shown) => void toggle.run(shown)}
        />
        <ErrorMessage message={toggle.error} />
        {isEditing ? (
          <Form onSubmit={edit.handleSubmit}>
            <TextField
              label={text.name}
              name="name"
              maxLength={EXTERNAL_CALENDAR_NAME_MAX_LENGTH}
              autoComplete="off"
              {...edit.bind('name')}
            />
            <ColorPicker value={edit.values.color} onChange={(color) => edit.setField('color', color)} />
            <ActionFeedback error={edit.error} />
            <div className="formActions">
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                {m.common.cancel}
              </Button>
              <Button type="submit" isPending={edit.isPending} pendingLabel={m.common.saving}>
                {m.common.save}
              </Button>
            </div>
          </Form>
        ) : (
          <div className="formActions">
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              {text.edit}
            </Button>
            <Button variant="dangerOutline" onClick={onRemove}>
              {text.remove}
            </Button>
          </div>
        )}
      </div>
    </li>
  )
}

export function ExternalCalendarSettings() {
  const { m } = useI18n()
  const text = m.external
  const { isAvailable, calendars, error, create, remove } = useExternalCalendars()
  const [toRemove, setToRemove] = useState<ExternalCalendar | null>(null)
  const add = useForm({
    initialValues: EMPTY,
    validate: ({ name, url }) => ({
      name: name.trim() ? undefined : text.nameRequired,
      url: isCalendarUrl(url) ? undefined : text.urlInvalid,
    }),
    onSubmit: async ({ name, url, color }) => {
      await create({ name: name.trim(), url: normalizeCalendarUrl(url), color })
      add.reset()
    },
  })

  if (!isAvailable) return null
  const canAdd = calendars.length < MAX_EXTERNAL_CALENDARS

  return (
    <PageSection title={text.title} description={text.description}>
      <ErrorMessage message={error} />
      {calendars.length > 0 ? (
        <ul className="calendarSettingList">
          {calendars.map((calendar) => (
            <ExternalCalendarRow key={calendar.id} calendar={calendar} onRemove={() => setToRemove(calendar)} />
          ))}
        </ul>
      ) : (
        <p className="emptyHint">{text.empty}</p>
      )}
      {canAdd ? (
        <Form onSubmit={add.handleSubmit}>
          <h3 className="formSubtitle">{text.addTitle}</h3>
          <TextField
            label={text.url}
            name="url"
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://"
            maxLength={EXTERNAL_CALENDAR_URL_MAX_LENGTH}
            {...add.bind('url')}
          />
          <p className="formHint">{text.urlHint}</p>
          <TextField
            label={text.name}
            name="name"
            autoComplete="off"
            maxLength={EXTERNAL_CALENDAR_NAME_MAX_LENGTH}
            {...add.bind('name')}
          />
          <ColorPicker value={add.values.color} onChange={(color) => add.setField('color', color)} />
          <ActionFeedback error={add.error} success={add.isSuccess && text.added} />
          <div className="formActions">
            <Button type="submit" isPending={add.isPending} pendingLabel={text.adding}>
              {text.add}
            </Button>
          </div>
        </Form>
      ) : (
        <p className="formHint">{text.limitReached(MAX_EXTERNAL_CALENDARS)}</p>
      )}
      {toRemove && (
        <ConfirmModal
          title={text.removeTitle}
          confirmLabel={text.remove}
          pendingLabel={text.removing}
          onConfirm={async () => {
            await remove(toRemove.id)
            setToRemove(null)
          }}
          onClose={() => setToRemove(null)}
        >
          {text.removeMessage(toRemove.name)}
        </ConfirmModal>
      )}
    </PageSection>
  )
}
