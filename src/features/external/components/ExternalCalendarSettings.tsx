import { EditToggle } from '../../../components/EditToggle.tsx'
import { Form } from '../../../components/Form.tsx'
import { ActionFeedback, ErrorMessage } from '../../../components/StatusMessage.tsx'
import { TextField, UrlField } from '../../../components/TextField.tsx'
import { useViewerTimeZone } from '../../../context/TimeZoneContext.ts'
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
import { ColorPicker, NameColorForm } from '../../events/index.ts'
import { useExternalCalendars } from '../hooks/useExternalCalendars.ts'
import { AsyncSwitch } from '../../../components/AsyncSwitch.tsx'
import { FormActions } from '../../../components/FormActions.tsx'
import { ManagedListSection } from '../../../components/ManagedListSection.tsx'

type AddValues = { name: string; url: string; color: EventColor }

const EMPTY: AddValues = { name: '', url: '', color: 'blue' }

function ExternalCalendarRow({ calendar, onRemove }: { calendar: ExternalCalendar; onRemove: () => void }) {
  const { m, locale } = useI18n()
  const text = m.external
  const timeZone = useViewerTimeZone()
  const { update, failedIds } = useExternalCalendars()
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
        <AsyncSwitch label={text.show} checked={calendar.shown} onChange={(shown) => update(calendar.id, { shown })} />
        <EditToggle editLabel={text.edit} removeLabel={text.remove} onRemove={onRemove}>
          {(close) => (
            <NameColorForm
              initialValues={{ name: calendar.name, color: calendar.color }}
              nameLabel={text.name}
              nameRequired={text.nameRequired}
              maxLength={EXTERNAL_CALENDAR_NAME_MAX_LENGTH}
              onSubmit={async (values) => {
                await update(calendar.id, values)
                close()
              }}
              onCancel={close}
            />
          )}
        </EditToggle>
      </div>
    </li>
  )
}

export function ExternalCalendarSettings() {
  const { m } = useI18n()
  const text = m.external
  const { isAvailable, calendars, error, create, remove } = useExternalCalendars()
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

  return (
    <ManagedListSection
      texts={text}
      items={calendars}
      max={MAX_EXTERNAL_CALENDARS}
      error={error}
      onRemove={(item) => remove(item.id)}
      addForm={
        <Form onSubmit={add.handleSubmit}>
          <h3 className="formSubtitle">{text.addTitle}</h3>
          <UrlField label={text.url} name="url" maxLength={EXTERNAL_CALENDAR_URL_MAX_LENGTH} {...add.bind('url')} />
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
          <FormActions isPending={add.isPending} submitLabel={text.add} pendingLabel={text.adding} />
        </Form>
      }
    >
      {(item, askRemove) => <ExternalCalendarRow key={item.id} calendar={item} onRemove={askRemove} />}
    </ManagedListSection>
  )
}
