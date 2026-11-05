import type { EventColor } from '../../../../utils/event.ts'
import { ColorPicker } from '../../../events/index.ts'
import { CalendarPreview } from '../CalendarPreview.tsx'

type ColorStepProps = {
  color: EventColor
  onChange: (color: EventColor) => void
}

export function ColorStep({ color, onChange }: ColorStepProps) {
  return (
    <div className="wizardSplit">
      <ColorPicker value={color} onChange={onChange} />
      <CalendarPreview color={color} />
    </div>
  )
}
