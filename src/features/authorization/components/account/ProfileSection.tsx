import { useI18n } from '../../../../i18n/index.ts'
import { Button } from '../../../../components/Button.tsx'
import { Form } from '../../../../components/Form.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { ActionFeedback } from '../../../../components/StatusMessage.tsx'
import { useForm } from '../../../../hooks/useForm.ts'
import { useAuth } from '../../hooks/useAuth.ts'
import type { User } from '../../types/auth.ts'
import { validateProfile } from '../../utils/validation.ts'
import { NameField } from '../AuthFields.tsx'

export function ProfileSection({ user }: { user: User }) {
  const { m } = useI18n()
  const { updateProfile } = useAuth()
  const { values, bind, handleSubmit, isPending, isSuccess, error } = useForm({
    initialValues: { name: user.name },
    validate: (input) => validateProfile(input, m),
    prepare: ({ name }) => ({ name: name.trim() }),
    onSubmit: async (input) => {
      await updateProfile(input)
    },
  })

  return (
    <PageSection title={m.auth.account.profile}>
      <Form onSubmit={handleSubmit}>
        <NameField {...bind('name')} />
        <ActionFeedback error={error} success={isSuccess && m.common.saved} />
        <div className="formActions">
          <Button
            type="submit"
            isPending={isPending}
            pendingLabel={m.auth.account.savePending}
            disabled={values.name.trim() === user.name}
          >
            {m.common.save}
          </Button>
        </div>
      </Form>
    </PageSection>
  )
}
