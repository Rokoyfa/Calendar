import { Button } from '../../../components/Button.tsx'
import { EditToggle } from '../../../components/EditToggle.tsx'
import { Form } from '../../../components/Form.tsx'
import { PasswordField } from '../../../components/PasswordField.tsx'
import { ActionFeedback, ErrorMessage } from '../../../components/StatusMessage.tsx'
import { TextField, UrlField } from '../../../components/TextField.tsx'
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
import { getEventColorAttributes } from '../../../utils/event.ts'
import { formatTimestamp } from '../../../utils/timestamp.ts'
import { NameColorForm } from '../../events/index.ts'
import { useCaldav } from '../hooks/useCaldav.ts'
import { ItemList } from '../../../components/ItemList.tsx'
import { FormActions } from '../../../components/FormActions.tsx'
import { AsyncSwitch } from '../../../components/AsyncSwitch.tsx'
import { ManagedListSection } from '../../../components/ManagedListSection.tsx'

type AddValues = { serverUrl: string; username: string; password: string; name: string }

const EMPTY: AddValues = { serverUrl: '', username: '', password: '', name: '' }

const hostOf = (value: string) => (isServerUrl(value) ? new URL(value.trim()).hostname : '')

function CaldavCalendarRow({ calendar }: { calendar: CaldavCalendar }) {
  const { m } = useI18n()
  const text = m.caldav.accounts
  const { updateCalendar } = useCaldav()

  return (
    <li className="caldavCalendar">
      <div className="caldavCalendarHeader">
        <span {...getEventColorAttributes(calendar.color, 'colorSwatch')} aria-hidden="true" />
        <span className="itemRowTitle">{calendar.name}</span>
        {calendar.readOnly && <span className="badge">{text.readOnly}</span>}
      </div>
      <AsyncSwitch
        label={text.show}
        checked={calendar.shown}
        onChange={(shown) => updateCalendar(calendar.id, { shown })}
      />
      <EditToggle editLabel={text.editCalendar}>
        {(close) => (
          <NameColorForm
            initialValues={{ name: calendar.name, color: calendar.color }}
            nameLabel={text.name}
            nameRequired={text.nameRequired}
            maxLength={CALDAV_NAME_MAX_LENGTH}
            onSubmit={async (values) => {
              await updateCalendar(calendar.id, values)
              close()
            }}
            onCancel={close}
          />
        )}
      </EditToggle>
    </li>
  )
}

function CaldavAccountForm({ account, onDone }: { account: CaldavAccount; onDone: () => void }) {
  const { m } = useI18n()
  const text = m.caldav.accounts
  const { update } = useCaldav()
  const edit = useForm({
    initialValues: { name: account.name, password: '' },
    validate: ({ name }) => (name.trim() ? {} : { name: text.nameRequired }),
    onSubmit: async ({ name, password }) => {
      await update(account.id, { name: name.trim(), ...(password ? { password } : {}) })
      onDone()
    },
  })

  return (
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
      <FormActions isPending={edit.isPending} onCancel={onDone} />
    </Form>
  )
}

function CaldavAccountCard({ account, onRemove }: { account: CaldavAccount; onRemove: () => void }) {
  const { m, locale } = useI18n()
  const text = m.caldav.accounts
  const timeZone = useViewerTimeZone()
  const { sync } = useCaldav()
  const syncNow = useAsyncAction(() => sync(account.id))
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
        <ItemList items={account.calendars} empty={text.noCalendars} className="caldavCalendarList">
          {(calendar) => <CaldavCalendarRow key={calendar.id} calendar={calendar} />}
        </ItemList>
        <EditToggle
          editLabel={text.edit}
          removeLabel={text.remove}
          onRemove={onRemove}
          before={
            <Button
              variant="outline"
              isPending={syncNow.isPending}
              pendingLabel={text.syncing}
              onClick={() => void syncNow.run()}
            >
              {text.sync}
            </Button>
          }
        >
          {(close) => <CaldavAccountForm account={account} onDone={close} />}
        </EditToggle>
      </div>
    </li>
  )
}

export function CaldavAccountSettings() {
  const { m } = useI18n()
  const text = m.caldav.accounts
  const { isAvailable, accounts, error, create, remove } = useCaldav()
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

  return (
    <ManagedListSection
      texts={text}
      items={accounts}
      max={MAX_CALDAV_ACCOUNTS}
      error={error}
      onRemove={(item) => remove(item.id)}
      addForm={
        <Form onSubmit={add.handleSubmit}>
          <h3 className="formSubtitle">{text.addTitle}</h3>
          <UrlField
            label={text.serverUrl}
            name="serverUrl"
            autoComplete="url"
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
          <FormActions isPending={add.isPending} submitLabel={text.add} pendingLabel={text.adding} />
        </Form>
      }
    >
      {(item, askRemove) => <CaldavAccountCard key={item.id} account={item} onRemove={askRemove} />}
    </ManagedListSection>
  )
}
