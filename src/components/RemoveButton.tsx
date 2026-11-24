import { IconButton } from './IconButton.tsx'

type RemoveButtonProps = {
  label: string
  disabled?: boolean
  onClick: () => void
}

export function RemoveButton({ label, disabled, onClick }: RemoveButtonProps) {
  return (
    <IconButton label={label} plain disabled={disabled} onClick={onClick}>
      ×
    </IconButton>
  )
}

export function CloseButton({ label, disabled, onClick }: RemoveButtonProps) {
  return (
    <button
      type="button"
      className="closeButton"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      ×
    </button>
  )
}
