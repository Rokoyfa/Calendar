import { useI18n } from '../../../../i18n/index.ts'
import { FormField } from '../../../../components/FormField.tsx'
import { TextField } from '../../../../components/TextField.tsx'
import type { FieldErrors } from '../../../../utils/validation.ts'
import { CALENDAR_DESCRIPTION_MAX_LENGTH, CALENDAR_NAME_MAX_LENGTH } from '../../constants/calendars.ts'
import type { DetailsValues } from '../../utils/draft.ts'

type DetailsStepProps = {
  values: DetailsValues
  errors: FieldErrors<DetailsValues>
  disabled?: Partial<Record<keyof DetailsValues, boolean>>
  hideDescription?: boolean
  autoFocus?: boolean
  onChange: (changes: Partial<DetailsValues>) => void
}

export function DetailsStep({
  values,
  errors,
  disabled = {},
  hideDescription = false,
  autoFocus = false,
  onChange,
}: DetailsStepProps) {
  const { m } = useI18n()
  const { details } = m.calendars
  return (
    <>
      <TextField
        label={details.name}
        name="name"
        autoComplete="off"
        maxLength={CALENDAR_NAME_MAX_LENGTH}
        placeholder={details.namePlaceholder}
        value={values.name}
        error={errors.name}
        disabled={disabled.name}
        onChange={(name) => onChange({ name })}
        autoFocus={autoFocus}
      />
      {!hideDescription && (
        <FormField label={details.descriptionOptional} error={errors.description}>
          <textarea
            className="textarea"
            name="description"
            maxLength={CALENDAR_DESCRIPTION_MAX_LENGTH}
            placeholder={details.descriptionPlaceholder}
            value={values.description}
            disabled={disabled.description}
            onChange={(event) => onChange({ description: event.target.value })}
          />
        </FormField>
      )}
    </>
  )
}
