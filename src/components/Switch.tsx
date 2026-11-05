type SwitchProps = {
  label: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}

export function Switch({ label, checked, disabled, onChange }: SwitchProps) {
  return (
    <label className="switch">
      <input
        type="checkbox"
        role="switch"
        className="switchInput"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="switchTrack" aria-hidden="true" />
      <span className="switchLabel">{label}</span>
    </label>
  )
}
