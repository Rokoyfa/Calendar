import { Link, useSearchParams } from 'react-router'
import { useI18n } from '../../../i18n/index.ts'
import { Button } from '../../../components/Button.tsx'
import { Form } from '../../../components/Form.tsx'
import { PageLayout } from '../../../components/PageLayout.tsx'
import { ActionFeedback } from '../../../components/StatusMessage.tsx'
import { ROUTES, TOKEN_PARAM } from '../../../config/routes.ts'
import { useForm } from '../../../hooks/useForm.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { validatePasswordReset, type NewPasswordValues } from '../utils/validation.ts'
import { NewPasswordFields } from './AuthFields.tsx'
import { ContinueLink } from './ContinueLink.tsx'

const EMPTY_PASSWORD: NewPasswordValues = { password: '', passwordConfirmation: '' }

function NewLinkLink() {
  const { m } = useI18n()
  return <Link to={ROUTES.forgotPassword}>{m.auth.reset.requestNewLink}</Link>
}

export function ResetPasswordPage() {
  const { m } = useI18n()
  const { resetPassword } = useAuth()
  const [searchParams] = useSearchParams()
  const token = searchParams.get(TOKEN_PARAM)
  const { values, errors, setField, handleSubmit, isPending, isSuccess, error } = useForm({
    initialValues: EMPTY_PASSWORD,
    validate: (input) => validatePasswordReset(input, m),
    onSubmit: ({ password }) => resetPassword({ token: token ?? '', password }),
  })

  const renderContent = () => {
    if (!token)
      return (
        <>
          <ActionFeedback error={m.auth.reset.incompleteLink} />
          <NewLinkLink />
        </>
      )

    if (isSuccess)
      return (
        <>
          <ActionFeedback error={null} success={m.auth.reset.success} />
          <ContinueLink />
        </>
      )

    return (
      <Form onSubmit={handleSubmit}>
        <NewPasswordFields label={m.auth.reset.newPassword} values={values} errors={errors} onChange={setField} />
        <ActionFeedback error={error} />
        {error && <NewLinkLink />}
        <Button type="submit" block isPending={isPending} pendingLabel={m.auth.reset.pending}>
          {m.auth.reset.submit}
        </Button>
      </Form>
    )
  }

  return <PageLayout title={m.auth.reset.title}>{renderContent()}</PageLayout>
}
