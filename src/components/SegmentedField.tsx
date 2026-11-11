import { FormField } from './FormField.tsx'
import { SegmentedControl, type SegmentedControlProps } from './SegmentedControl.tsx'

export function SegmentedField<T extends string>({ label, ...controlProps }: SegmentedControlProps<T>) {
  return (
    <FormField as="fieldset" label={label}>
      <SegmentedControl label={label} {...controlProps} />
    </FormField>
  )
}
