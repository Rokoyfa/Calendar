import { useEffect, useMemo, useRef } from 'react'
import { ChoiceChip } from '../../../components/ChoiceChip.tsx'
import { FormField } from '../../../components/FormField.tsx'
import { classNames } from '../../../utils/classNames.ts'
import { isHexColor, normalizeHexColor } from '../../../utils/color.ts'
import {
  getEventColorAttributes,
  getEventColorLabel,
  PRESET_EVENT_COLORS,
  type EventColor,
} from '../../../utils/event.ts'
import { DEFAULT_CUSTOM_COLOR } from '../constants/colors.ts'
import { useCustomColors } from '../hooks/useCustomColors.ts'

type ColorPickerProps = {
  value: EventColor
  onChange: (color: EventColor) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const { colors: customColors, addColor, canAddMore } = useCustomColors()
  const addInputRef = useRef<HTMLInputElement>(null)

  const options = useMemo<EventColor[]>(() => {
    const list: EventColor[] = [...PRESET_EVENT_COLORS, ...customColors]
    if (isHexColor(value) && !list.includes(value)) list.push(value)
    return list
  }, [customColors, value])

  useEffect(() => {
    const input = addInputRef.current
    if (!input) return

    const handleChange = () => {
      if (!isHexColor(input.value)) return
      const color = normalizeHexColor(input.value)
      onChange(color)
      void addColor(color)
    }

    input.addEventListener('change', handleChange)
    return () => input.removeEventListener('change', handleChange)
  }, [addColor, onChange, canAddMore])

  return (
    <FormField as="fieldset" label="Farbe">
      <div className="choiceList">
        {options.map((color) => {
          const { className, style } = getEventColorAttributes(color)
          return (
            <ChoiceChip
              key={color}
              type="radio"
              name="eventColor"
              label={getEventColorLabel(color)}
              checked={value === color}
              onChange={() => onChange(color)}
              className={classNames('color', className)}
              style={style}
            />
          )
        })}

        {canAddMore && (
          <label className="chip color colorAdd" title="Eigene Farbe hinzufügen">
            <input
              ref={addInputRef}
              type="color"
              className="visuallyHidden"
              aria-label="Eigene Farbe hinzufügen"
              defaultValue={DEFAULT_CUSTOM_COLOR}
            />
          </label>
        )}
      </div>
    </FormField>
  )
}
