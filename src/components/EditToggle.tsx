import { useState, type ReactNode } from 'react'
import { Button } from './Button.tsx'

type EditToggleProps = {
  editLabel: string
  before?: ReactNode
  after?: ReactNode
  removeLabel?: string
  onRemove?: () => void
  children: (close: () => void) => ReactNode
}

export function EditToggle({ editLabel, before, after, removeLabel, onRemove, children }: EditToggleProps) {
  const [isEditing, setIsEditing] = useState(false)

  if (isEditing) return children(() => setIsEditing(false))

  return (
    <div className="formActions">
      {before}
      <Button variant="outline" onClick={() => setIsEditing(true)}>
        {editLabel}
      </Button>
      {after}
      {onRemove && removeLabel && (
        <Button variant="dangerOutline" onClick={onRemove}>
          {removeLabel}
        </Button>
      )}
    </div>
  )
}
