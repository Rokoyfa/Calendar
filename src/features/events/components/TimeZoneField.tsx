import { useMemo } from 'react'
import { SelectField, type SelectOption } from '../../../components/SelectField.tsx'
import { useI18n } from '../../../i18n/index.ts'
import { formatTimeZoneLabel, listTimeZones } from '../../../utils/timeZone.ts'

const FLOATING = ''

type TimeZoneFieldProps = {
  value: string | null
  onChange: (timeZone: string | null) => void
}

export function TimeZoneField({ value, onChange }: TimeZoneFieldProps) {
  const { m } = useI18n()
  const options = useMemo<SelectOption<string>[]>(() => {
    const zones = listTimeZones()
    if (value && !zones.includes(value)) zones.unshift(value)
    return [
      { value: FLOATING, label: m.events.floatingTimeZone },
      ...zones.map((zone) => ({ value: zone, label: formatTimeZoneLabel(zone) })),
    ]
  }, [m, value])

  return (
    <SelectField
      label={m.events.timeZone}
      name="timeZone"
      value={value ?? FLOATING}
      options={options}
      onChange={(next) => onChange(next === FLOATING ? null : next)}
    />
  )
}
