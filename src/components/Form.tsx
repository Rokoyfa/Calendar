import type { KeyboardEvent, ReactNode, SubmitEventHandler } from 'react'
import { classNames } from '../utils/classNames.ts'

type FormProps = {
  onSubmit: SubmitEventHandler<HTMLFormElement>
  className?: string
  children: ReactNode
}

const submitWithShortcut = (event: KeyboardEvent<HTMLFormElement>) => {
  if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey) || event.altKey || event.defaultPrevented) return
  event.preventDefault()
  event.currentTarget.requestSubmit()
}

export function Form({ onSubmit, className, children }: FormProps) {
  return (
    <form
      className={classNames('formSection', className)}
      method="post"
      noValidate
      aria-keyshortcuts="Control+Enter Meta+Enter"
      onSubmit={onSubmit}
      onKeyDown={submitWithShortcut}
    >
      {children}
    </form>
  )
}
