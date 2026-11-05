import { classNames } from '../utils/classNames.ts'

type StepperProps = {
  steps: readonly { label: string }[]
  current: number
  onSelect?: (index: number) => void
}

const getState = (index: number, current: number) =>
  index < current ? 'done' : index === current ? 'current' : 'upcoming'

export function Stepper({ steps, current, onSelect }: StepperProps) {
  return (
    <ol className="stepper" aria-label="Fortschritt">
      {steps.map((step, index) => {
        const state = getState(index, current)
        const content = (
          <>
            <span className="stepNumber" aria-hidden="true">
              {state === 'done' ? '✓' : index + 1}
            </span>
            <span className="stepLabel">{step.label}</span>
          </>
        )
        return (
          <li
            key={step.label}
            className={classNames('step', `step--${state}`)}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            {onSelect && state === 'done' ? (
              <button type="button" className="stepContent" onClick={() => onSelect(index)}>
                {content}
              </button>
            ) : (
              <span className="stepContent">{content}</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
