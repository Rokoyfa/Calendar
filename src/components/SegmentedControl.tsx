import { classNames } from '../utils/classNames.ts'

export type SegmentedControlProps<T extends string> = {
  label: string
  value: T
  options: readonly { value: T; label: string; title?: string }[]
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string>({ label, value, options, onChange }: SegmentedControlProps<T>) {
  return (
    <div className="segmentedControl" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={classNames('segment', option.value === value && 'active')}
          aria-pressed={option.value === value}
          title={option.title}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
