import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { isHexColor, normalizeHexColor, type HexColor } from '../../../utils/color.ts'
import { getEventColorLabel, PRESET_EVENT_COLORS, type EventColor } from '../../../utils/event.ts'
import { DEFAULT_CUSTOM_COLOR } from '../constants/colors.ts'
import { useCustomColors } from '../hooks/useCustomColors.ts'

type ColorPickerProps = {
  value: EventColor
  onChange: (color: EventColor) => void
}

const swatchClassName = (color: EventColor, selected: boolean) =>
  [
    'color',
    isHexColor(color) ? 'color--custom' : `color-${color}`,
    selected ? 'activ' : null,
  ]
    .filter(Boolean)
    .join(' ')

const swatchStyle = (color: EventColor) =>
  isHexColor(color) ? ({ '--swatch-color': color } as CSSProperties) : undefined

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
      const color: HexColor = normalizeHexColor(input.value)
      onChange(color)
      void addColor(color)
    }

    input.addEventListener('change', handleChange)
    return () => input.removeEventListener('change', handleChange)
  }, [addColor, onChange, canAddMore])

  return (
    <fieldset className="colorPicker">
      <legend className="descriptor">Farbe</legend>
      <div className="colors">
        {options.map((color) => (
          <label
            key={color}
            className={swatchClassName(color, value === color)}
            style={swatchStyle(color)}
            title={getEventColorLabel(color)}
          >
            <input
              type="radio"
              name="eventColor"
              value={color}
              className="visuallyHidden"
              aria-label={getEventColorLabel(color)}
              checked={value === color}
              onChange={() => onChange(color)}
            />
          </label>
        ))}

        {canAddMore && (
          <label className="color colorAdd" title="Eigene Farbe hinzufügen">
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
    </fieldset>
  )
}
