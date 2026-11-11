import { useState } from 'react'
import { useI18n } from '../../../../i18n/index.ts'
import { Button } from '../../../../components/Button.tsx'
import { Form } from '../../../../components/Form.tsx'
import { Modal } from '../../../../components/Modal.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { ActionFeedback } from '../../../../components/StatusMessage.tsx'
import { useForm } from '../../../../hooks/useForm.ts'
import { useAuth } from '../../hooks/useAuth.ts'
import type { AccountDeletionInput } from '../../types/auth.ts'
import { validateAccountDeletion } from '../../utils/validation.ts'
import { CurrentPasswordField } from '../AuthFields.tsx'

const EMPTY_DELETION: AccountDeletionInput = { password: '' }

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const { m } = useI18n()
  const { deleteAccount } = useAuth()
  const { bind, handleSubmit, isPending, error } = useForm({
    initialValues: EMPTY_DELETION,
    validate: (input) => validateAccountDeletion(input, m),
    onSubmit: deleteAccount,
  })

  return (
    <Modal title={m.auth.account.deleteTitle} variant="danger" onClose={onClose}>
      <Form onSubmit={handleSubmit}>
        <p>
          {m.auth.account.deleteWarningBefore}
          <strong>{m.auth.account.deleteWarningStrong}</strong>
          {m.auth.account.deleteWarningAfter}
        </p>
        <CurrentPasswordField
          label={m.auth.account.deletePassword}
          {...bind('password')}
          data-autofocus
        />
        <ActionFeedback error={error} />
        <div className="formActions">
          <Button variant="secondary" onClick={onClose}>
            {m.common.cancel}
          </Button>
          <Button type="submit" variant="danger" isPending={isPending} pendingLabel={m.auth.account.deletePending}>
            {m.auth.account.deleteSubmit}
          </Button>
        </div>
      </Form>
    </Modal>
  )
}

export function DeleteAccountSection() {
  const { m } = useI18n()
  const [isConfirming, setIsConfirming] = useState(false)

  return (
    <PageSection title={m.auth.account.deleteTitle} tone="danger" description={m.auth.account.deleteDescription}>
      <div className="formActions">
        <Button variant="danger" onClick={() => setIsConfirming(true)}>
          {m.auth.account.deleteOpen}
        </Button>
      </div>
      {isConfirming && <DeleteAccountModal onClose={() => setIsConfirming(false)} />}
    </PageSection>
  )
}
