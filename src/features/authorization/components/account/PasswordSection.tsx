import { useI18n } from '../../../../i18n/index.ts'
import { Form } from '../../../../components/Form.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { ActionFeedback } from '../../../../components/StatusMessage.tsx'
import { useForm } from '../../../../hooks/useForm.ts'
import { useAuth } from '../../hooks/useAuth.ts'
import { validatePasswordChange, type PasswordChangeFormValues } from '../../utils/validation.ts'
import { CurrentPasswordField, NewPasswordFields } from '../AuthFields.tsx'
import { FormActions } from '../../../../components/FormActions.tsx'

const EMPTY_PASSWORD_CHANGE: PasswordChangeFormValues = { currentPassword: '', password: '', passwordConfirmation: '' }

export function PasswordSection() {
  const { m } = useI18n()
  const { changePassword } = useAuth()
  const { values, errors, setField, bind, handleSubmit, reset, isPending, isSuccess, error } = useForm({
    initialValues: EMPTY_PASSWORD_CHANGE,
    validate: (input) => validatePasswordChange(input, m),
    onSubmit: async ({ currentPassword, password }) => {
      await changePassword({ currentPassword, newPassword: password })
      reset()
    },
  })

  return (
    <PageSection title={m.auth.account.passwordTitle} description={m.auth.account.passwordDescription}>
      <Form onSubmit={handleSubmit}>
        <CurrentPasswordField
          label={m.auth.account.currentPassword}
          name="currentPassword"
          {...bind('currentPassword')}
        />
        <NewPasswordFields label={m.auth.account.newPassword} values={values} errors={errors} onChange={setField} />
        <ActionFeedback error={error} success={isSuccess && m.auth.account.passwordChanged} />
        <FormActions
          isPending={isPending}
          submitLabel={m.auth.account.passwordSubmit}
          pendingLabel={m.auth.account.passwordPending}
        />
      </Form>
    </PageSection>
  )
}
