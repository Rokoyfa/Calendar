import { FormField } from './FormField.tsx'

type NumberFieldProps = {
  label: string
  name: string
  value: number | null
  min: number
  max: number
  unit?: string
  error?: string
  onChange: (value: number) => void
}

export function NumberField({ label, name, value, min, max, unit, error, onChange }: NumberFieldProps) {
  return (
    <FormField label={label} error={error}>
      <span className="inlineField">
        <input
          className="input numberInput"
          type="number"
          name={name}
          min={min}
          max={max}
          step={1}
          value={value === null || Number.isNaN(value) ? '' : value}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.valueAsNumber)}
        />
        {unit && <span>{unit}</span>}
      </span>
    </FormField>
  )
}
