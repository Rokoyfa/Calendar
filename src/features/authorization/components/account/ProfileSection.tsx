import type { SubmitEventHandler } from 'react'
import { PageSection } from '../../../../components/PageSection.tsx'
import { ErrorMessage, StatusMessage } from '../../../../components/StatusMessage.tsx'
import { TextField } from '../../../../components/TextField.tsx'
import { useAsyncAction } from '../../../../hooks/useAsyncAction.ts'
import { useFormState } from '../../../../hooks/useFormState.ts'
import { useAuth } from '../../hooks/useAuth.ts'
import type { ProfileInput, User } from '../../types/auth.ts'
import { NAME_MAX_LENGTH, validateProfile } from '../../utils/validation.ts'

export function ProfileSection({ user }: { user: User }) {
  const { updateProfile } = useAuth()
  const { values, errors, setField, validateAll } = useFormState<ProfileInput>({ name: user.name }, validateProfile)
  const { run, isPending, isSuccess, error } = useAsyncAction(async (input: ProfileInput) => {
    await updateProfile(input)
  })

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    const input = { name: values.name.trim() }
    if (validateAll(input)) void run(input)
  }

  return (
    <PageSection title="Profil">
      <form className="formSection" noValidate onSubmit={handleSubmit}>
        <TextField
          label="Name"
          name="name"
          autoComplete="name"
          maxLength={NAME_MAX_LENGTH}
          value={values.name}
          error={errors.name}
          onChange={(name) => setField('name', name)}
        />
        <ErrorMessage message={error} />
        <StatusMessage tone="success" message={isSuccess ? 'Gespeichert.' : null} />
        <div className="formActions">
          <button type="submit" className="button" disabled={isPending || values.name.trim() === user.name}>
            {isPending ? 'Wird gespeichert …' : 'Speichern'}
          </button>
        </div>
      </form>
    </PageSection>
  )
}
