import { Link, useNavigate, useSearchParams } from 'react-router'
import { useI18n } from '../../../i18n/index.ts'
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
  const { m } = useI18n()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = getRedirectTarget(searchParams)
  const { values, errors, setField, handleSubmit, isPending, error } = useForm({
    initialValues: EMPTY_LOGIN,
    validate: (input) => validateLogin(input, m),
    prepare: (input) => ({ ...input, email: normalizeEmail(input.email) }),
    onSubmit: async (input) => {
      await login(input)
      await navigate(redirectTo, { replace: true })
    },
  })

  return (
    <PageLayout
      title={m.auth.login.title}
      footer={
        <>
          {m.auth.login.noAccount} <Link to={withRedirect(ROUTES.register, redirectTo)}>{m.auth.login.registerLink}</Link>
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
          {m.auth.login.forgotPassword}
        </Link>
        <ActionFeedback error={error} />
        <Button type="submit" block isPending={isPending} pendingLabel={m.auth.login.pending}>
          {m.auth.login.submit}
        </Button>
      </Form>
    </PageLayout>
  )
}
