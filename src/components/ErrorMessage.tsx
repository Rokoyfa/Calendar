import { classNames } from '../utils/classNames.ts'

type ErrorMessageProps = {
  message: string | null | undefined
  className?: string
}

export function ErrorMessage({ message, className }: ErrorMessageProps) {
  if (!message) return null
  return (
    <p className={classNames('errorText', className)} role="alert">
      {message}
    </p>
  )
}
