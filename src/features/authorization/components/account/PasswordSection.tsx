import { Button } from '../../../../components/Button.tsx'
import { Form } from '../../../../components/Form.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { ActionFeedback } from '../../../../components/StatusMessage.tsx'
import { useForm } from '../../../../hooks/useForm.ts'
import { useAuth } from '../../hooks/useAuth.ts'
import { validatePasswordChange, type PasswordChangeFormValues } from '../../utils/validation.ts'
import { CurrentPasswordField, NewPasswordFields } from '../AuthFields.tsx'

const EMPTY_PASSWORD_CHANGE: PasswordChangeFormValues = { currentPassword: '', password: '', passwordConfirmation: '' }

export function PasswordSection() {
  const { changePassword } = useAuth()
  const { values, errors, setField, handleSubmit, reset, isPending, isSuccess, error } = useForm({
    initialValues: EMPTY_PASSWORD_CHANGE,
    validate: validatePasswordChange,
    onSubmit: async ({ currentPassword, password }) => {
      await changePassword({ currentPassword, newPassword: password })
      reset()
    },
  })

  return (
    <PageSection title="Passwort ändern" description="Andere Geräte werden danach abgemeldet.">
      <Form onSubmit={handleSubmit}>
        <CurrentPasswordField
          label="Aktuelles Passwort"
          name="currentPassword"
          value={values.currentPassword}
          error={errors.currentPassword}
          onChange={(currentPassword) => setField('currentPassword', currentPassword)}
        />
        <NewPasswordFields label="Neues Passwort" values={values} errors={errors} onChange={setField} />
        <ActionFeedback error={error} success={isSuccess && 'Dein Passwort wurde geändert.'} />
        <div className="formActions">
          <Button type="submit" isPending={isPending} pendingLabel="Wird geändert …">
            Passwort ändern
          </Button>
        </div>
      </Form>
    </PageSection>
  )
}
