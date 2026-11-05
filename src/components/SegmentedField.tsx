import { FormField } from './FormField.tsx'
import { SegmentedControl } from './SegmentedControl.tsx'

type SegmentedFieldProps<T extends string> = {
  label: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
}

export function SegmentedField<T extends string>({ label, ...controlProps }: SegmentedFieldProps<T>) {
  return (
    <FormField as="fieldset" label={label}>
      <SegmentedControl label={label} {...controlProps} />
    </FormField>
  )
}
