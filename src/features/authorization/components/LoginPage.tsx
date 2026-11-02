import type { SubmitEventHandler } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ErrorMessage } from '../../../components/ErrorMessage.tsx'
import { PasswordField } from '../../../components/PasswordField.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { getRedirectTarget, ROUTES, withRedirect } from '../../../config/routes.ts'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useFormState } from '../../../hooks/useFormState.ts'
import { useAuth } from '../hooks/useAuth.ts'
import type { LoginInput } from '../types/auth.ts'
import { EMAIL_MAX_LENGTH, normalizeEmail, PASSWORD_MAX_LENGTH, validateLogin } from '../utils/validation.ts'
import { AuthLayout } from './AuthLayout.tsx'

const EMPTY_LOGIN: LoginInput = { email: '', password: '' }

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = getRedirectTarget(searchParams)
  const { values, errors, setField, validateAll } = useFormState(EMPTY_LOGIN, validateLogin)
  const { run, isPending, error } = useAsyncAction(async (input: LoginInput) => {
    await login(input)
    await navigate(redirectTo, { replace: true })
  })

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    const input = { ...values, email: normalizeEmail(values.email) }
    if (validateAll(input)) void run(input)
  }

  return (
    <AuthLayout
      title="Anmelden"
      footer={
        <>
          Noch kein Konto? <Link to={withRedirect(ROUTES.register, redirectTo)}>Jetzt registrieren</Link>
        </>
      }
    >
      <form className="formSection" method="post" noValidate onSubmit={handleSubmit}>
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
        <PasswordField
          label="Passwort"
          name="password"
          autoComplete="current-password"
          maxLength={PASSWORD_MAX_LENGTH}
          value={values.password}
          error={errors.password}
          onChange={(password) => setField('password', password)}
        />
        <ErrorMessage message={error} />
        <button type="submit" className="button button--block" disabled={isPending}>
          {isPending ? 'Wird angemeldet …' : 'Anmelden'}
        </button>
      </form>
    </AuthLayout>
  )
}
