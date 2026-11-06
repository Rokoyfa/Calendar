import { Link } from 'react-router'
import { useI18n } from '../../../i18n/index.ts'
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
  const { m } = useI18n()
  const { requestPasswordReset } = useAuth()
  const { values, errors, setField, handleSubmit, isPending, isSuccess, error } = useForm({
    initialValues: EMPTY_REQUEST,
    validate: (input) => validatePasswordResetRequest(input, m),
    prepare: ({ email }) => ({ email: normalizeEmail(email) }),
    onSubmit: requestPasswordReset,
  })

  return (
    <PageLayout
      title={m.auth.forgot.title}
      footer={
        <>
          {m.auth.forgot.remembered} <Link to={ROUTES.login}>{m.auth.forgot.loginLink}</Link>
        </>
      }
    >
      {isSuccess ? (
        <ActionFeedback
          error={null}
          success={m.auth.forgot.success(normalizeEmail(values.email))}
        />
      ) : (
        <Form onSubmit={handleSubmit}>
          <p className="formHint">{m.auth.forgot.hint}</p>
          <EmailField
            value={values.email}
            error={errors.email}
            onChange={(email) => setField('email', email)}
            autoFocus
          />
          <ActionFeedback error={error} />
          <Button type="submit" block isPending={isPending} pendingLabel={m.auth.forgot.pending}>
            {m.auth.forgot.submit}
          </Button>
        </Form>
      )}
    </PageLayout>
  )
}
