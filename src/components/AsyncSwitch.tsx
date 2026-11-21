import { useAsyncAction } from '../hooks/useAsyncAction.ts'
import { ErrorMessage } from './StatusMessage.tsx'
import { Switch } from './Switch.tsx'

type AsyncSwitchProps = {
  label: string
  checked: boolean
  onChange: (checked: boolean) => Promise<void>
}

export function AsyncSwitch({ label, checked, onChange }: AsyncSwitchProps) {
  const { run, isPending, error } = useAsyncAction(onChange)
  return (
    <>
      <Switch label={label} checked={checked} disabled={isPending} onChange={(value) => void run(value)} />
      <ErrorMessage message={error} />
    </>
  )
}
