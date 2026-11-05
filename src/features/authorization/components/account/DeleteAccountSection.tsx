import { useState } from 'react'
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
  const { deleteAccount } = useAuth()
  const { values, errors, setField, handleSubmit, isPending, error } = useForm({
    initialValues: EMPTY_DELETION,
    validate: validateAccountDeletion,
    onSubmit: deleteAccount,
  })

  return (
    <Modal title="Konto löschen" variant="danger" onClose={onClose}>
      <Form onSubmit={handleSubmit}>
        <p>
          Dein Konto, dein persönlicher Kalender und alle Termine darin werden <strong>endgültig gelöscht</strong>. Das
          lässt sich nicht rückgängig machen.
        </p>
        <CurrentPasswordField
          label="Passwort zur Bestätigung"
          value={values.password}
          error={errors.password}
          onChange={(password) => setField('password', password)}
          data-autofocus
        />
        <ActionFeedback error={error} />
        <div className="formActions">
          <Button variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" variant="danger" isPending={isPending} pendingLabel="Wird gelöscht …">
            Endgültig löschen
          </Button>
        </div>
      </Form>
    </Modal>
  )
}

export function DeleteAccountSection() {
  const [isConfirming, setIsConfirming] = useState(false)

  return (
    <PageSection title="Konto löschen" tone="danger" description="Löscht dein Konto mit allen persönlichen Terminen.">
      <div className="formActions">
        <Button variant="danger" onClick={() => setIsConfirming(true)}>
          Konto löschen …
        </Button>
      </div>
      {isConfirming && <DeleteAccountModal onClose={() => setIsConfirming(false)} />}
    </PageSection>
  )
}
