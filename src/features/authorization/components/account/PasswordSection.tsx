import type { SubmitEventHandler } from 'react'
import { PageSection } from '../../../../components/PageSection.tsx'
import { PasswordField } from '../../../../components/PasswordField.tsx'
import { ErrorMessage, StatusMessage } from '../../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../../hooks/useAsyncAction.ts'
import { useFormState } from '../../../../hooks/useFormState.ts'
import { useAuth } from '../../hooks/useAuth.ts'
import type { PasswordChangeInput } from '../../types/auth.ts'
import { PASSWORD_MAX_LENGTH, validatePasswordChange, type PasswordChangeFormValues } from '../../utils/validation.ts'
import { NewPasswordFields } from '../NewPasswordFields.tsx'

const EMPTY_PASSWORD_CHANGE: PasswordChangeFormValues = { currentPassword: '', password: '', passwordConfirmation: '' }

export function PasswordSection() {
  const { changePassword } = useAuth()
  const { values, errors, setField, validateAll, reset } = useFormState(EMPTY_PASSWORD_CHANGE, validatePasswordChange)
  const { run, isPending, isSuccess, error } = useAsyncAction(async (input: PasswordChangeInput) => {
    await changePassword(input)
    reset()
  })

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    if (validateAll()) void run({ currentPassword: values.currentPassword, newPassword: values.password })
  }

  return (
    <PageSection title="Passwort ändern" description="Andere Geräte werden danach abgemeldet.">
      <form className="formSection" noValidate onSubmit={handleSubmit}>
        <PasswordField
          label="Aktuelles Passwort"
          name="currentPassword"
          autoComplete="current-password"
          maxLength={PASSWORD_MAX_LENGTH}
          value={values.currentPassword}
          error={errors.currentPassword}
          onChange={(currentPassword) => setField('currentPassword', currentPassword)}
        />
        <NewPasswordFields label="Neues Passwort" values={values} errors={errors} onChange={setField} />
        <ErrorMessage message={error} />
        <StatusMessage tone="success" message={isSuccess ? 'Dein Passwort wurde geändert.' : null} />
        <div className="formActions">
          <button type="submit" className="button" disabled={isPending}>
            {isPending ? 'Wird geändert …' : 'Passwort ändern'}
          </button>
        </div>
      </form>
    </PageSection>
  )
}
