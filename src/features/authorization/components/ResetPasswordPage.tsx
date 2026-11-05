import { Link, useSearchParams } from 'react-router'
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

const NewLinkLink = () => <Link to={ROUTES.forgotPassword}>Neuen Link anfordern</Link>

export function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const [searchParams] = useSearchParams()
  const token = searchParams.get(TOKEN_PARAM)
  const { values, errors, setField, handleSubmit, isPending, isSuccess, error } = useForm({
    initialValues: EMPTY_PASSWORD,
    validate: validatePasswordReset,
    onSubmit: ({ password }) => resetPassword({ token: token ?? '', password }),
  })

  const renderContent = () => {
    if (!token)
      return (
        <>
          <ActionFeedback error="Dieser Link ist unvollständig. Bitte fordere einen neuen an." />
          <NewLinkLink />
        </>
      )

    if (isSuccess)
      return (
        <>
          <ActionFeedback error={null} success="Dein Passwort wurde geändert." />
          <ContinueLink />
        </>
      )

    return (
      <Form onSubmit={handleSubmit}>
        <NewPasswordFields label="Neues Passwort" values={values} errors={errors} onChange={setField} />
        <ActionFeedback error={error} />
        {error && <NewLinkLink />}
        <Button type="submit" block isPending={isPending} pendingLabel="Wird gespeichert …">
          Passwort speichern
        </Button>
      </Form>
    )
  }

  return <PageLayout title="Neues Passwort">{renderContent()}</PageLayout>
}
