import { useState } from 'react'
import { Button } from '../../../components/Button.tsx'
import { ConfirmModal } from '../../../components/ConfirmModal.tsx'
import { Form } from '../../../components/Form.tsx'
import { PageSection } from '../../../components/PageSection.tsx'
import { PasswordField } from '../../../components/PasswordField.tsx'
import { ActionFeedback, ErrorMessage } from '../../../components/StatusMessage.tsx'
import { Switch } from '../../../components/Switch.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { useViewerTimeZone } from '../../../context/TimeZoneContext.ts'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useForm } from '../../../hooks/useForm.ts'
import { useI18n } from '../../../i18n/index.ts'
import { isErrorCode } from '../../../utils/appError.ts'
import {
  CALDAV_NAME_MAX_LENGTH,
  CALDAV_PASSWORD_MAX_LENGTH,
  CALDAV_URL_MAX_LENGTH,
  CALDAV_USERNAME_MAX_LENGTH,
  isServerUrl,
  MAX_CALDAV_ACCOUNTS,
  type CaldavAccount,
  type CaldavCalendar,
} from '../../../utils/caldav.ts'
import { getEventColorAttributes, type EventColor } from '../../../utils/event.ts'
import { formatTimestamp } from '../../../utils/timestamp.ts'
import { ColorPicker } from '../../events/index.ts'
import { useCaldav } from '../hooks/useCaldav.ts'

type AddValues = { serverUrl: string; username: string; password: string; name: string }

const EMPTY: AddValues = { serverUrl: '', username: '', password: '', name: '' }

const hostOf = (value: string) => (isServerUrl(value) ? new URL(value.trim()).hostname : '')

function CaldavCalendarRow({ calendar }: { calendar: CaldavCalendar }) {
  const { m } = useI18n()
  const text = m.caldav.accounts
  const { updateCalendar } = useCaldav()
  const [isEditing, setIsEditing] = useState(false)
  const toggle = useAsyncAction((shown: boolean) => updateCalendar(calendar.id, { shown }))
  const edit = useForm<{ name: string; color: EventColor }>({
    initialValues: { name: calendar.name, color: calendar.color },
    validate: ({ name }) => (name.trim() ? {} : { name: text.nameRequired }),
    onSubmit: async ({ name, color }) => {
      await updateCalendar(calendar.id, { name: name.trim(), color })
      setIsEditing(false)
    },
  })

  return (
    <li className="caldavCalendar">
      <div className="caldavCalendarHeader">
        <span {...getEventColorAttributes(calendar.color, 'colorSwatch')} aria-hidden="true" />
        <span className="itemRowTitle">{calendar.name}</span>
        {calendar.readOnly && <span className="badge">{text.readOnly}</span>}
      </div>
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
            maxLength={CALDAV_NAME_MAX_LENGTH}
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
            {text.editCalendar}
          </Button>
        </div>
      )}
    </li>
  )
}

function CaldavAccountCard({ account, onRemove }: { account: CaldavAccount; onRemove: () => void }) {
  const { m, locale } = useI18n()
  const text = m.caldav.accounts
  const timeZone = useViewerTimeZone()
  const { update, sync } = useCaldav()
  const [isEditing, setIsEditing] = useState(false)
  const syncNow = useAsyncAction(() => sync(account.id))
  const edit = useForm({
    initialValues: { name: account.name, password: '' },
    validate: ({ name }) => (name.trim() ? {} : { name: text.nameRequired }),
    onSubmit: async ({ name, password }) => {
      await update(account.id, { name: name.trim(), ...(password ? { password } : {}) })
      setIsEditing(false)
    },
  })
  const syncError = account.syncError && isErrorCode(account.syncError) ? account.syncError : null

  return (
    <li className="calendarSettingCard">
      <div className="calendarSettingHeader">
        <span className="itemRowMain">
          <span className="itemRowTitle">{account.name}</span>
          <span className="itemRowMeta">
            {account.username} · {account.serverHost}
          </span>
          <span className="itemRowMeta">
            {account.syncedAt ? text.synced(formatTimestamp(account.syncedAt, locale, timeZone)) : text.neverSynced}
          </span>
        </span>
      </div>
      <div className="calendarSettingBody">
        {syncError && <ErrorMessage message={m.errors[syncError]} />}
        <ErrorMessage message={syncNow.error} />
        <h3 className="formSubtitle">{text.calendars}</h3>
        {account.calendars.length > 0 ? (
          <ul className="caldavCalendarList">
            {account.calendars.map((calendar) => (
              <CaldavCalendarRow key={calendar.id} calendar={calendar} />
            ))}
          </ul>
        ) : (
          <p className="emptyHint">{text.noCalendars}</p>
        )}
        {isEditing ? (
          <Form onSubmit={edit.handleSubmit}>
            <TextField
              label={text.name}
              name="name"
              maxLength={CALDAV_NAME_MAX_LENGTH}
              autoComplete="off"
              {...edit.bind('name')}
            />
            <PasswordField
              label={text.newPassword}
              name="password"
              autoComplete="new-password"
              maxLength={CALDAV_PASSWORD_MAX_LENGTH}
              {...edit.bind('password')}
            />
            <p className="formHint">{text.newPasswordHint}</p>
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
            <Button
              variant="outline"
              isPending={syncNow.isPending}
              pendingLabel={text.syncing}
              onClick={() => void syncNow.run()}
            >
              {text.sync}
            </Button>
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

export function CaldavAccountSettings() {
  const { m } = useI18n()
  const text = m.caldav.accounts
  const { isAvailable, accounts, error, create, remove } = useCaldav()
  const [toRemove, setToRemove] = useState<CaldavAccount | null>(null)
  const add = useForm({
    initialValues: EMPTY,
    validate: ({ serverUrl, username, password }) => ({
      serverUrl: isServerUrl(serverUrl) ? undefined : text.serverUrlInvalid,
      username: username.trim() ? undefined : text.usernameRequired,
      password: password ? undefined : text.passwordRequired,
    }),
    onSubmit: async ({ serverUrl, username, password, name }) => {
      await create({
        serverUrl: serverUrl.trim(),
        username: username.trim(),
        password,
        name: name.trim() || hostOf(serverUrl),
      })
      add.reset()
    },
  })

  if (!isAvailable) return null
  const canAdd = accounts.length < MAX_CALDAV_ACCOUNTS

  return (
    <PageSection title={text.title} description={text.description}>
      <ErrorMessage message={error} />
      {accounts.length > 0 ? (
        <ul className="calendarSettingList">
          {accounts.map((account) => (
            <CaldavAccountCard key={account.id} account={account} onRemove={() => setToRemove(account)} />
          ))}
        </ul>
      ) : (
        <p className="emptyHint">{text.empty}</p>
      )}
      {canAdd ? (
        <Form onSubmit={add.handleSubmit}>
          <h3 className="formSubtitle">{text.addTitle}</h3>
          <TextField
            label={text.serverUrl}
            name="serverUrl"
            type="url"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            placeholder="https://"
            maxLength={CALDAV_URL_MAX_LENGTH}
            {...add.bind('serverUrl')}
          />
          <p className="formHint">{text.serverUrlHint}</p>
          <TextField
            label={text.username}
            name="caldavUsername"
            autoComplete="off"
            spellCheck={false}
            maxLength={CALDAV_USERNAME_MAX_LENGTH}
            {...add.bind('username')}
          />
          <PasswordField
            label={text.password}
            name="caldavPassword"
            autoComplete="new-password"
            maxLength={CALDAV_PASSWORD_MAX_LENGTH}
            {...add.bind('password')}
          />
          <p className="formHint">{text.passwordHint}</p>
          <TextField
            label={text.name}
            name="name"
            autoComplete="off"
            placeholder={hostOf(add.values.serverUrl)}
            maxLength={CALDAV_NAME_MAX_LENGTH}
            {...add.bind('name')}
          />
          <ActionFeedback error={add.error} success={add.isSuccess && text.added} />
          <div className="formActions">
            <Button type="submit" isPending={add.isPending} pendingLabel={text.adding}>
              {text.add}
            </Button>
          </div>
        </Form>
      ) : (
        <p className="formHint">{text.limitReached(MAX_CALDAV_ACCOUNTS)}</p>
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
