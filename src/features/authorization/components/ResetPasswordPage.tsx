import type { SubmitEventHandler } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PageLayout } from '../../../components/PageLayout.tsx'
import { ErrorMessage, StatusMessage } from '../../../components/StatusMessage.tsx'
import { ROUTES, TOKEN_PARAM } from '../../../config/routes.ts'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useFormState } from '../../../hooks/useFormState.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { validatePasswordReset, type NewPasswordValues } from '../utils/validation.ts'
import { NewPasswordFields } from './NewPasswordFields.tsx'

const EMPTY_PASSWORD: NewPasswordValues = { password: '', passwordConfirmation: '' }

export function ResetPasswordPage() {
  const { user, resetPassword } = useAuth()
  const [searchParams] = useSearchParams()
  const token = searchParams.get(TOKEN_PARAM)
  const { values, errors, setField, validateAll } = useFormState(EMPTY_PASSWORD, validatePasswordReset)
  const { run, isPending, isSuccess, error } = useAsyncAction(resetPassword)

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    if (token && validateAll()) void run({ token, password: values.password })
  }

  const renderContent = () => {
    if (!token)
      return (
        <>
          <ErrorMessage message="Dieser Link ist unvollständig. Bitte fordere einen neuen an." />
          <Link to={ROUTES.forgotPassword}>Neuen Link anfordern</Link>
        </>
      )

    if (isSuccess)
      return (
        <>
          <StatusMessage tone="success" message="Dein Passwort wurde geändert." />
          <Link to={user ? ROUTES.calendar : ROUTES.login} className="button button--block">
            {user ? 'Zum Kalender' : 'Jetzt anmelden'}
          </Link>
        </>
      )

    return (
      <form className="formSection" method="post" noValidate onSubmit={handleSubmit}>
        <NewPasswordFields label="Neues Passwort" values={values} errors={errors} onChange={setField} />
        <ErrorMessage message={error} />
        {error && <Link to={ROUTES.forgotPassword}>Neuen Link anfordern</Link>}
        <button type="submit" className="button button--block" disabled={isPending}>
          {isPending ? 'Wird gespeichert …' : 'Passwort speichern'}
        </button>
      </form>
    )
  }

  return <PageLayout title="Neues Passwort">{renderContent()}</PageLayout>
}
