import { Form } from '../../../components/Form.tsx'
import { FormActions } from '../../../components/FormActions.tsx'
import { ActionFeedback } from '../../../components/StatusMessage.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { useForm } from '../../../hooks/useForm.ts'
import type { EventColor } from '../../../domain/event.ts'
import { ColorPicker } from './ColorPicker.tsx'

export type NameColorValues = { name: string; color: EventColor }

type NameColorFormProps = {
  initialValues: NameColorValues
  nameLabel: string
  nameRequired: string
  maxLength: number
  onSubmit: (values: NameColorValues) => Promise<void>
  onCancel: () => void
}

export function NameColorForm({
  initialValues,
  nameLabel,
  nameRequired,
  maxLength,
  onSubmit,
  onCancel,
}: NameColorFormProps) {
  const form = useForm({
    initialValues,
    validate: ({ name }) => (name.trim() ? {} : { name: nameRequired }),
    onSubmit: ({ name, color }) => onSubmit({ name: name.trim(), color }),
  })

  return (
    <Form onSubmit={form.handleSubmit}>
      <TextField label={nameLabel} name="name" maxLength={maxLength} autoComplete="off" {...form.bind('name')} />
      <ColorPicker value={form.values.color} onChange={(color) => form.setField('color', color)} />
      <ActionFeedback error={form.error} />
      <FormActions isPending={form.isPending} onCancel={onCancel} />
    </Form>
  )
}
