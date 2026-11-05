import { Link, useNavigate, useSearchParams } from 'react-router'
import { Button } from '../../../components/Button.tsx'
import { Form } from '../../../components/Form.tsx'
import { PageLayout } from '../../../components/PageLayout.tsx'
import { ActionFeedback } from '../../../components/StatusMessage.tsx'
import { getRedirectTarget, ROUTES, withRedirect } from '../../../config/routes.ts'
import { useForm } from '../../../hooks/useForm.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { normalizeEmail, validateRegister, type RegisterFormValues } from '../utils/validation.ts'
import { EmailField, NameField, NewPasswordFields } from './AuthFields.tsx'

const EMPTY_REGISTRATION: RegisterFormValues = { name: '', email: '', password: '', passwordConfirmation: '' }

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = getRedirectTarget(searchParams)
  const { values, errors, setField, handleSubmit, isPending, error } = useForm({
    initialValues: EMPTY_REGISTRATION,
    validate: validateRegister,
    prepare: (input) => ({ ...input, name: input.name.trim(), email: normalizeEmail(input.email) }),
    onSubmit: async ({ name, email, password }) => {
      await register({ name, email, password })
      await navigate(redirectTo, { replace: true })
    },
  })

  return (
    <PageLayout
      title="Registrieren"
      footer={
        <>
          Schon ein Konto? <Link to={withRedirect(ROUTES.login, redirectTo)}>Anmelden</Link>
        </>
      }
    >
      <Form onSubmit={handleSubmit}>
        <NameField value={values.name} error={errors.name} onChange={(name) => setField('name', name)} autoFocus />
        <EmailField
          isNewAccount
          value={values.email}
          error={errors.email}
          onChange={(email) => setField('email', email)}
        />
        <NewPasswordFields values={values} errors={errors} onChange={setField} />
        <ActionFeedback error={error} />
        <Button type="submit" block isPending={isPending} pendingLabel="Konto wird erstellt …">
          Konto erstellen
        </Button>
      </Form>
    </PageLayout>
  )
}
