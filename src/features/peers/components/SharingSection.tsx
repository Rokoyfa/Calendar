import { useCallback, useState } from 'react'
import { Button } from '../../../components/Button.tsx'
import { ConfirmModal } from '../../../components/ConfirmModal.tsx'
import { Form } from '../../../components/Form.tsx'
import { ItemList } from '../../../components/ItemList.tsx'
import { LimitedAdd } from '../../../components/LimitedAdd.tsx'
import { PageSection } from '../../../components/PageSection.tsx'
import { ActionFeedback, ErrorMessage } from '../../../components/StatusMessage.tsx'
import { EmailTextField } from '../../../components/TextField.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import { useConfirm } from '../../../hooks/useConfirm.ts'
import { useI18n } from '../../../i18n/index.ts'
import { removeById } from '../../../utils/list.ts'
import { MAX_VIEWERS, type SharingState, type SharingViewer } from '../utils/peerCalendar.ts'
import { normalizeEmail, validateEmail } from '../../../utils/validation.ts'
import { useAuth } from '../../authorization/index.ts'
import type { PersonalSharingRepository } from '../../storage/index.ts'

const INITIAL: SharingState = { enabled: false, viewers: [] }

type SharingSectionProps = { repository: PersonalSharingRepository }

function ViewerRow({ viewer, onRemove }: { viewer: SharingViewer; onRemove: () => void }) {
  const { m, format } = useI18n()
  const text = m.peers.sharing
  const isPending = viewer.status === 'pending'

  return (
    <li className="itemRow">
      <span className="itemRowMain">
        <span className="itemRowTitle">{viewer.name ?? viewer.email}</span>
        <span className="itemRowMeta">
          {viewer.name && `${viewer.email} · `}
          {isPending && viewer.expiresAt ? text.validUntil(format.longDateOf(viewer.expiresAt)) : text.accepted}
        </span>
      </span>
      {isPending && <span className="badge">{text.pending}</span>}
      <Button variant="dangerOutline" onClick={onRemove}>
        {text.remove}
      </Button>
    </li>
  )
}

export function SharingSection({ repository }: SharingSectionProps) {
  const { m } = useI18n()
  const text = m.peers.sharing
  const { user } = useAuth()
  const load = useCallback(() => repository.getSharing(), [repository])
  const { data, error, isLoading, setData, update } = useAsyncResource(load, INITIAL)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isDisabling, setIsDisabling] = useState(false)
  const removal = useConfirm<SharingViewer>()
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState<string>()
  const [sent, setSent] = useState(false)
  const invite = useAsyncAction(async (address: string) => {
    const viewer = await repository.invite(address)
    update((current) => ({ ...current, viewers: [...current.viewers, viewer] }))
    setSent(true)
    setEmail('')
  })

  const submit = () => {
    const address = normalizeEmail(email)
    const message =
      validateEmail(address, m) ??
      (user?.email && normalizeEmail(user.email) === address ? text.selfInvite : undefined) ??
      (data.viewers.some((viewer) => viewer.email === address) ? m.errors.alreadyShared : undefined)
    setFieldError(message)
    setSent(false)
    if (!message) void invite.run(address)
  }

  const toRemove = removal.target

  return (
    <PageSection title={text.title} description={text.description}>
      <ErrorMessage message={error} />
      {!isLoading && !error && (
        <>
          <p className="sharingState">
            <span className={data.enabled ? 'badge badge--success' : 'badge'}>{data.enabled ? text.on : text.off}</span>
          </p>
          {data.enabled ? (
            <>
              <p className="formHint">{text.privateHint}</p>
              <h3 className="formSubtitle">{text.viewersTitle}</h3>
              <ItemList items={data.viewers} empty={text.empty}>
                {(viewer) => <ViewerRow key={viewer.id} viewer={viewer} onRemove={() => removal.ask(viewer)} />}
              </ItemList>
              <LimitedAdd count={data.viewers.length} max={MAX_VIEWERS} limitText={text.limitReached}>
                <Form
                  onSubmit={(event) => {
                    event.preventDefault()
                    submit()
                  }}
                >
                  <h3 className="formSubtitle">{text.inviteTitle}</h3>
                  <div className="formRow inviteRow">
                    <EmailTextField
                      label={text.email}
                      name="sharingEmail"
                      value={email}
                      error={fieldError}
                      onChange={(value) => {
                        setEmail(value)
                        setFieldError(undefined)
                      }}
                    />
                    <Button
                      type="submit"
                      className="inviteAdd"
                      isPending={invite.isPending}
                      pendingLabel={text.inviting}
                    >
                      {text.invite}
                    </Button>
                  </div>
                  <p className="formHint">{text.inviteHint}</p>
                  <ActionFeedback error={invite.error} success={sent && text.invited} />
                </Form>
              </LimitedAdd>
              <div className="formActions">
                <Button variant="dangerOutline" onClick={() => setIsDisabling(true)}>
                  {text.disable}
                </Button>
              </div>
            </>
          ) : (
            <div className="formActions">
              <Button onClick={() => setIsConfirming(true)}>{text.enable}</Button>
            </div>
          )}
        </>
      )}
      {isConfirming && (
        <ConfirmModal
          tone="neutral"
          title={text.confirmTitle}
          confirmLabel={text.confirm}
          pendingLabel={text.enabling}
          details={
            <ul className="sharingPoints">
              {text.confirmPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          }
          onConfirm={async () => setData(await repository.setSharing(true))}
          onClose={() => setIsConfirming(false)}
        >
          {text.confirmIntro}
        </ConfirmModal>
      )}
      {isDisabling && (
        <ConfirmModal
          title={text.disableTitle}
          confirmLabel={text.disable}
          pendingLabel={text.disabling}
          onConfirm={async () => setData(await repository.setSharing(false))}
          onClose={() => setIsDisabling(false)}
        >
          {text.disableMessage}
        </ConfirmModal>
      )}
      {toRemove && (
        <ConfirmModal
          title={text.removeTitle}
          confirmLabel={text.remove}
          pendingLabel={text.removing}
          onConfirm={async () => {
            await repository.removeViewer(toRemove.id)
            update((current) => ({ ...current, viewers: removeById(current.viewers, toRemove.id) }))
          }}
          onClose={removal.close}
        >
          {text.removeMessage(toRemove.name ?? toRemove.email)}
        </ConfirmModal>
      )}
    </PageSection>
  )
}
