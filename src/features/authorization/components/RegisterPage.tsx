import type { SubmitEventHandler } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ErrorMessage } from '../../../components/ErrorMessage.tsx'
import { PasswordField } from '../../../components/PasswordField.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { getRedirectTarget, ROUTES, withRedirect } from '../../../config/routes.ts'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useFormState } from '../../../hooks/useFormState.ts'
import { useAuth } from '../hooks/useAuth.ts'
import type { RegisterInput } from '../types/auth.ts'
import {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  normalizeEmail,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  validateRegister,
  type RegisterFormValues,
} from '../utils/validation.ts'
import { AuthLayout } from './AuthLayout.tsx'

const EMPTY_REGISTRATION: RegisterFormValues = { name: '', email: '', password: '', passwordConfirmation: '' }

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = getRedirectTarget(searchParams)
  const { values, errors, setField, validateAll } = useFormState(EMPTY_REGISTRATION, validateRegister)
  const { run, isPending, error } = useAsyncAction(async (input: RegisterInput) => {
    await register(input)
    await navigate(redirectTo, { replace: true })
  })

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    const prepared = { ...values, name: values.name.trim(), email: normalizeEmail(values.email) }
    if (validateAll(prepared)) void run({ name: prepared.name, email: prepared.email, password: prepared.password })
  }

  return (
    <AuthLayout
      title="Registrieren"
      footer={
        <>
          Schon ein Konto? <Link to={withRedirect(ROUTES.login, redirectTo)}>Anmelden</Link>
        </>
      }
    >
      <form className="formSection" method="post" noValidate onSubmit={handleSubmit}>
        <TextField
          label="Name"
          name="name"
          autoComplete="name"
          maxLength={NAME_MAX_LENGTH}
          value={values.name}
          error={errors.name}
          onChange={(name) => setField('name', name)}
          autoFocus
        />
        <TextField
          label="E-Mail-Adresse"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={EMAIL_MAX_LENGTH}
          value={values.email}
          error={errors.email}
          onChange={(email) => setField('email', email)}
        />
        <PasswordField
          label="Passwort"
          name="password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          value={values.password}
          error={errors.password}
          onChange={(password) => setField('password', password)}
        />
        <PasswordField
          label="Passwort wiederholen"
          name="passwordConfirmation"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          value={values.passwordConfirmation}
          error={errors.passwordConfirmation}
          onChange={(confirmation) => setField('passwordConfirmation', confirmation)}
        />
        <p className="formHint">Mindestens {PASSWORD_MIN_LENGTH} Zeichen.</p>
        <ErrorMessage message={error} />
        <button type="submit" className="button button--block" disabled={isPending}>
          {isPending ? 'Konto wird erstellt …' : 'Konto erstellen'}
        </button>
      </form>
    </AuthLayout>
  )
}
