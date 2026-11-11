import { Link } from 'react-router'
import { useI18n } from '../../../i18n/index.ts'
import { Button } from '../../../components/Button.tsx'
import { Form } from '../../../components/Form.tsx'
import { PageLayout } from '../../../components/PageLayout.tsx'
import { ActionFeedback } from '../../../components/StatusMessage.tsx'
import { ROUTES, withRedirect } from '../../../config/routes.ts'
import { useForm } from '../../../hooks/useForm.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { useRedirectTarget } from '../hooks/useRedirectTarget.ts'
import { normalizeEmail, validateRegister, type RegisterFormValues } from '../utils/validation.ts'
import { EmailField, NameField, NewPasswordFields } from './AuthFields.tsx'

const EMPTY_REGISTRATION: RegisterFormValues = { name: '', email: '', password: '', passwordConfirmation: '' }

export function RegisterPage() {
  const { m } = useI18n()
  const { register } = useAuth()
  const { redirectTo, continueToTarget } = useRedirectTarget()
  const { values, errors, setField, bind, handleSubmit, isPending, error } = useForm({
    initialValues: EMPTY_REGISTRATION,
    validate: (input) => validateRegister(input, m),
    prepare: (input) => ({ ...input, name: input.name.trim(), email: normalizeEmail(input.email) }),
    onSubmit: async ({ name, email, password }) => {
      await register({ name, email, password })
      await continueToTarget()
    },
  })

  return (
    <PageLayout
      title={m.auth.register.title}
      footer={
        <>
          {m.auth.register.hasAccount} <Link to={withRedirect(ROUTES.login, redirectTo)}>{m.auth.register.loginLink}</Link>
        </>
      }
    >
      <Form onSubmit={handleSubmit}>
        <NameField {...bind('name')} autoFocus />
        <EmailField
          isNewAccount
          {...bind('email')}
        />
        <NewPasswordFields values={values} errors={errors} onChange={setField} />
        <ActionFeedback error={error} />
        <Button type="submit" block isPending={isPending} pendingLabel={m.auth.register.pending}>
          {m.auth.register.submit}
        </Button>
      </Form>
    </PageLayout>
  )
}
