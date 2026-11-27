import { useCallback, useState } from 'react'
import { Button } from '../../../components/Button.tsx'
import { ConfirmModal } from '../../../components/ConfirmModal.tsx'
import { Form } from '../../../components/Form.tsx'
import { PageSection } from '../../../components/PageSection.tsx'
import { ActionFeedback, ErrorMessage } from '../../../components/StatusMessage.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { useViewerTimeZone } from '../../../context/TimeZoneContext.ts'
import { useFeatures } from '../../../context/HostContext.ts'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import { useForm } from '../../../hooks/useForm.ts'
import { useI18n } from '../../../i18n/index.ts'
import {
  CALDAV_NAME_MAX_LENGTH,
  MAX_APP_PASSWORDS,
  type AppPassword,
  type CaldavAccess,
  type CreatedAppPassword,
} from '../utils/caldav.ts'
import { formatTimestamp } from '../../../utils/timestamp.ts'
import { useStorage, type AppPasswordRepository } from '../../storage/index.ts'
import { useIsCaldavServerAvailable } from '../hooks/useIsCaldavServerAvailable.ts'
import { removeById } from '../../../utils/list.ts'
import { useConfirm } from '../../../hooks/useConfirm.ts'
import { CopyButton } from '../../../components/CopyButton.tsx'
import { ItemList } from '../../../components/ItemList.tsx'
import { LimitedAdd } from '../../../components/LimitedAdd.tsx'
import { FormActions } from '../../../components/FormActions.tsx'

const NO_PASSWORDS: AppPassword[] = []

function CopyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="copyValue">
      <span className="copyValueLabel">{label}</span>
      <code className="copyValueText">{value}</code>
      <CopyButton value={value} />
    </div>
  )
}

function AccessData({ repository }: { repository: AppPasswordRepository }) {
  const { m } = useI18n()
  const load = useCallback(() => repository.access(), [repository])
  const { data, error } = useAsyncResource<CaldavAccess | null>(load, null)
  return (
    <>
      <ErrorMessage message={error} />
      {data && (
        <div className="copyValues">
          <CopyValue label={m.caldav.server.serverUrl} value={data.serverUrl} />
          <CopyValue label={m.caldav.server.username} value={data.username} />
        </div>
      )}
    </>
  )
}

function ActiveServerSettings({ repository }: { repository: AppPasswordRepository }) {
  const { m, locale } = useI18n()
  const text = m.caldav.server
  const { tasks } = useFeatures()
  const timeZone = useViewerTimeZone()
  const load = useCallback(() => repository.list(), [repository])
  const { data: passwords, error, update } = useAsyncResource(load, NO_PASSWORDS)
  const [created, setCreated] = useState<CreatedAppPassword | null>(null)
  const revocation = useConfirm<AppPassword>()
  const toRevoke = revocation.target
  const add = useForm({
    initialValues: { name: '' },
    validate: ({ name }) => (name.trim() ? {} : { name: text.nameRequired }),
    onSubmit: async ({ name }) => {
      const entry = await repository.create(name.trim())
      const listed: AppPassword = {
        id: entry.id,
        name: entry.name,
        createdAt: entry.createdAt,
        lastUsedAt: entry.lastUsedAt,
      }
      update((current) => [listed, ...current])
      setCreated(entry)
      add.reset()
    },
  })
  const time = (iso: string) => formatTimestamp(iso, locale, timeZone)

  return (
    <PageSection title={text.title} description={text.description}>
      {tasks && <p className="formHint">{text.tasksHint}</p>}
      <AccessData repository={repository} />
      <h3 className="formSubtitle">{text.passwordsTitle}</h3>
      <p className="formHint">{text.passwordsDescription}</p>
      <ErrorMessage message={error} />
      {created && (
        <div className="newAppPassword" role="status">
          <strong>{text.newPasswordTitle}</strong>
          <CopyValue label={created.name} value={created.password} />
          <p className="formHint">{text.newPasswordHint}</p>
          <div className="formActions">
            <Button variant="outline" onClick={() => setCreated(null)}>
              {text.done}
            </Button>
          </div>
        </div>
      )}
      <ItemList items={passwords} empty={text.empty} className="sessionList">
        {(entry) => (
          <li key={entry.id} className="sessionItem">
            <div className="sessionInfo">
              <span className="sessionDevice">{entry.name}</span>
              <span className="formHint">
                {[
                  text.created(time(entry.createdAt)),
                  entry.lastUsedAt ? text.lastUsed(time(entry.lastUsedAt)) : text.neverUsed,
                ].join(' · ')}
              </span>
            </div>
            <Button variant="dangerOutline" onClick={() => revocation.ask(entry)}>
              {text.revoke}
            </Button>
          </li>
        )}
      </ItemList>
      <LimitedAdd count={passwords.length} max={MAX_APP_PASSWORDS} limitText={text.limitReached}>
        <Form onSubmit={add.handleSubmit}>
          <TextField
            label={text.name}
            name="appPasswordName"
            autoComplete="off"
            placeholder={text.namePlaceholder}
            maxLength={CALDAV_NAME_MAX_LENGTH}
            {...add.bind('name')}
          />
          <ActionFeedback error={add.error} />
          <FormActions isPending={add.isPending} submitLabel={text.create} pendingLabel={text.creating} />
        </Form>
      </LimitedAdd>
      {toRevoke && (
        <ConfirmModal
          title={text.revokeTitle}
          confirmLabel={text.revoke}
          pendingLabel={text.revoking}
          onConfirm={async () => {
            await repository.remove(toRevoke.id)
            update((current) => removeById(current, toRevoke.id))
          }}
          onClose={revocation.close}
        >
          {text.revokeMessage(toRevoke.name)}
        </ConfirmModal>
      )}
    </PageSection>
  )
}

export function CaldavServerSettings() {
  const { appPasswords } = useStorage()
  const isAvailable = useIsCaldavServerAvailable()
  if (!isAvailable || !appPasswords) return null
  return <ActiveServerSettings repository={appPasswords} />
}
