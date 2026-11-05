import { useState, type SubmitEventHandler } from 'react'
import { useNavigate } from 'react-router'
import { Modal } from '../../../../components/Modal.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { PasswordField } from '../../../../components/PasswordField.tsx'
import { ErrorMessage } from '../../../../components/StatusMessage.tsx'
import { ROUTES } from '../../../../config/routes.ts'
import { useAsyncAction } from '../../../../hooks/useAsyncAction.ts'
import { useFormState } from '../../../../hooks/useFormState.ts'
import { useAuth } from '../../hooks/useAuth.ts'
import type { AccountDeletionInput } from '../../types/auth.ts'
import { PASSWORD_MAX_LENGTH, validateAccountDeletion } from '../../utils/validation.ts'

const EMPTY_DELETION: AccountDeletionInput = { password: '' }

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const { deleteAccount } = useAuth()
  const navigate = useNavigate()
  const { values, errors, setField, validateAll } = useFormState(EMPTY_DELETION, validateAccountDeletion)
  const { run, isPending, error } = useAsyncAction(async (input: AccountDeletionInput) => {
    await deleteAccount(input)
    await navigate(ROUTES.calendar, { replace: true })
  })

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    if (validateAll()) void run(values)
  }

  return (
    <Modal title="Konto löschen" variant="danger" onClose={onClose}>
      <form className="formSection" noValidate onSubmit={handleSubmit}>
        <p>
          Dein Konto, dein persönlicher Kalender und alle Termine darin werden <strong>endgültig gelöscht</strong>.
          Das lässt sich nicht rückgängig machen.
        </p>
        <PasswordField
          label="Passwort zur Bestätigung"
          name="password"
          autoComplete="current-password"
          maxLength={PASSWORD_MAX_LENGTH}
          value={values.password}
          error={errors.password}
          onChange={(password) => setField('password', password)}
          data-autofocus
        />
        <ErrorMessage message={error} />
        <div className="formActions">
          <button type="button" className="button button--secondary" onClick={onClose}>
            Abbrechen
          </button>
          <button type="submit" className="button button--danger" disabled={isPending}>
            {isPending ? 'Wird gelöscht …' : 'Endgültig löschen'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function DeleteAccountSection() {
  const [isConfirming, setIsConfirming] = useState(false)

  return (
    <PageSection title="Konto löschen" tone="danger" description="Löscht dein Konto mit allen persönlichen Terminen.">
      <div className="formActions">
        <button type="button" className="button button--danger" onClick={() => setIsConfirming(true)}>
          Konto löschen …
        </button>
      </div>
      {isConfirming && <DeleteAccountModal onClose={() => setIsConfirming(false)} />}
    </PageSection>
  )
}
