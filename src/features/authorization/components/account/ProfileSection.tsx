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
  const { updateProfile } = useAuth()
  const { values, errors, setField, handleSubmit, isPending, isSuccess, error } = useForm({
    initialValues: { name: user.name },
    validate: validateProfile,
    prepare: ({ name }) => ({ name: name.trim() }),
    onSubmit: async (input) => {
      await updateProfile(input)
    },
  })

  return (
    <PageSection title="Profil">
      <Form onSubmit={handleSubmit}>
        <NameField value={values.name} error={errors.name} onChange={(name) => setField('name', name)} />
        <ActionFeedback error={error} success={isSuccess && 'Gespeichert.'} />
        <div className="formActions">
          <Button
            type="submit"
            isPending={isPending}
            pendingLabel="Wird gespeichert …"
            disabled={values.name.trim() === user.name}
          >
            Speichern
          </Button>
        </div>
      </Form>
    </PageSection>
  )
}
