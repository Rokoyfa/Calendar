import { classNames } from '../utils/classNames.ts'

type StatusMessageProps = {
  message: string | null | undefined
  tone?: 'error' | 'success'
  className?: string
}

export function StatusMessage({ message, tone = 'error', className }: StatusMessageProps) {
  if (!message) return null
  return (
    <p
      className={classNames(tone === 'error' ? 'errorText' : 'successText', className)}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {message}
    </p>
  )
}

export function ErrorMessage(props: Omit<StatusMessageProps, 'tone'>) {
  return <StatusMessage {...props} tone="error" />
}
