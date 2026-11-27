import { FormField } from './FormField.tsx'
import { Select } from './Input.tsx'

export type SelectOption<T extends string> = {
  value: T
  label: string
}

type SelectFieldProps<T extends string> = {
  label: string
  name: string
  value: T
  options: readonly SelectOption<T>[]
  onChange: (value: T) => void
}

export function SelectField<T extends string>({ label, name, value, options, onChange }: SelectFieldProps<T>) {
  return (
    <FormField label={label}>
      <Select
        name={name}
        value={value}
        onChange={(event) => {
          const option = options.find((candidate) => candidate.value === event.target.value)
          if (option) onChange(option.value)
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </FormField>
  )
}
