import { Link } from 'react-router'
import { Button } from '../../../components/Button.tsx'
import { Form } from '../../../components/Form.tsx'
import { PageLayout } from '../../../components/PageLayout.tsx'
import { ActionFeedback } from '../../../components/StatusMessage.tsx'
import { ROUTES } from '../../../config/routes.ts'
import { useForm } from '../../../hooks/useForm.ts'
import { useAuth } from '../hooks/useAuth.ts'
import type { PasswordResetRequestInput } from '../types/auth.ts'
import { normalizeEmail, validatePasswordResetRequest } from '../utils/validation.ts'
import { EmailField } from './AuthFields.tsx'

const EMPTY_REQUEST: PasswordResetRequestInput = { email: '' }

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const { values, errors, setField, handleSubmit, isPending, isSuccess, error } = useForm({
    initialValues: EMPTY_REQUEST,
    validate: validatePasswordResetRequest,
    prepare: ({ email }) => ({ email: normalizeEmail(email) }),
    onSubmit: requestPasswordReset,
  })

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
        <ActionFeedback
          error={null}
          success={`Falls es ein Konto für ${normalizeEmail(values.email)} gibt, haben wir dir einen Link zum Zurücksetzen geschickt. Er ist eine Stunde gültig.`}
        />
      ) : (
        <Form onSubmit={handleSubmit}>
          <p className="formHint">
            Gib die E-Mail-Adresse deines Kontos ein. Wir schicken dir einen Link für ein neues Passwort.
          </p>
          <EmailField
            value={values.email}
            error={errors.email}
            onChange={(email) => setField('email', email)}
            autoFocus
          />
          <ActionFeedback error={error} />
          <Button type="submit" block isPending={isPending} pendingLabel="Wird gesendet …">
            Link senden
          </Button>
        </Form>
      )}
    </PageLayout>
  )
}
