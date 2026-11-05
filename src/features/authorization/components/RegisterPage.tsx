import type { SubmitEventHandler } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { PageLayout } from '../../../components/PageLayout.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
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
  validateRegister,
  type RegisterFormValues,
} from '../utils/validation.ts'
import { NewPasswordFields } from './NewPasswordFields.tsx'

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
    <PageLayout
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
        <NewPasswordFields values={values} errors={errors} onChange={setField} />
        <ErrorMessage message={error} />
        <button type="submit" className="button button--block" disabled={isPending}>
          {isPending ? 'Konto wird erstellt …' : 'Konto erstellen'}
        </button>
      </form>
    </PageLayout>
  )
}
