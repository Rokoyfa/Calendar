import { Link, useNavigate, useSearchParams } from 'react-router'
import { Button } from '../../../components/Button.tsx'
import { Form } from '../../../components/Form.tsx'
import { PageLayout } from '../../../components/PageLayout.tsx'
import { ActionFeedback } from '../../../components/StatusMessage.tsx'
import { getRedirectTarget, ROUTES, withRedirect } from '../../../config/routes.ts'
import { useForm } from '../../../hooks/useForm.ts'
import { useAuth } from '../hooks/useAuth.ts'
import type { LoginInput } from '../types/auth.ts'
import { normalizeEmail, validateLogin } from '../utils/validation.ts'
import { CurrentPasswordField, EmailField } from './AuthFields.tsx'

const EMPTY_LOGIN: LoginInput = { email: '', password: '' }

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = getRedirectTarget(searchParams)
  const { values, errors, setField, handleSubmit, isPending, error } = useForm({
    initialValues: EMPTY_LOGIN,
    validate: validateLogin,
    prepare: (input) => ({ ...input, email: normalizeEmail(input.email) }),
    onSubmit: async (input) => {
      await login(input)
      await navigate(redirectTo, { replace: true })
    },
  })

  return (
    <PageLayout
      title="Anmelden"
      footer={
        <>
          Noch kein Konto? <Link to={withRedirect(ROUTES.register, redirectTo)}>Jetzt registrieren</Link>
        </>
      }
    >
      <Form onSubmit={handleSubmit}>
        <EmailField
          value={values.email}
          error={errors.email}
          onChange={(email) => setField('email', email)}
          autoFocus
        />
        <CurrentPasswordField
          value={values.password}
          error={errors.password}
          onChange={(password) => setField('password', password)}
        />
        <Link to={ROUTES.forgotPassword} className="formLink">
          Passwort vergessen?
        </Link>
        <ActionFeedback error={error} />
        <Button type="submit" block isPending={isPending} pendingLabel="Wird angemeldet …">
          Anmelden
        </Button>
      </Form>
    </PageLayout>
  )
}
