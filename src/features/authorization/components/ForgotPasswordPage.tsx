import type { SubmitEventHandler } from 'react'
import { Link } from 'react-router'
import { PageLayout } from '../../../components/PageLayout.tsx'
import { ErrorMessage, StatusMessage } from '../../../components/StatusMessage.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { ROUTES } from '../../../config/routes.ts'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useFormState } from '../../../hooks/useFormState.ts'
import { useAuth } from '../hooks/useAuth.ts'
import type { PasswordResetRequestInput } from '../types/auth.ts'
import { EMAIL_MAX_LENGTH, normalizeEmail, validatePasswordResetRequest } from '../utils/validation.ts'

const EMPTY_REQUEST: PasswordResetRequestInput = { email: '' }

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const { values, errors, setField, validateAll } = useFormState(EMPTY_REQUEST, validatePasswordResetRequest)
  const { run, isPending, isSuccess, error } = useAsyncAction(requestPasswordReset)

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    const input = { email: normalizeEmail(values.email) }
    if (validateAll(input)) void run(input)
  }

  return (
    <PageLayout
      title="Passwort vergessen"
      footer={
        <>
          Wieder eingefallen? <Link to={ROUTES.login}>Anmelden</Link>
        </>
      }
    >
      {isSuccess ? (
        <StatusMessage
          tone="success"
          message={`Falls es ein Konto für ${normalizeEmail(values.email)} gibt, haben wir dir einen Link zum Zurücksetzen geschickt. Er ist eine Stunde gültig.`}
        />
      ) : (
        <form className="formSection" method="post" noValidate onSubmit={handleSubmit}>
          <p className="formHint">Gib die E-Mail-Adresse deines Kontos ein. Wir schicken dir einen Link für ein neues Passwort.</p>
          <TextField
            label="E-Mail-Adresse"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            maxLength={EMAIL_MAX_LENGTH}
            value={values.email}
            error={errors.email}
            onChange={(email) => setField('email', email)}
            autoFocus
          />
          <ErrorMessage message={error} />
          <button type="submit" className="button button--block" disabled={isPending}>
            {isPending ? 'Wird gesendet …' : 'Link senden'}
          </button>
        </form>
      )}
    </PageLayout>
  )
}
