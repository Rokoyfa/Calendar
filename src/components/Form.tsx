import type { ReactNode, SubmitEventHandler } from 'react'
import { classNames } from '../utils/classNames.ts'

type FormProps = {
  onSubmit: SubmitEventHandler<HTMLFormElement>
  className?: string
  children: ReactNode
}

export function Form({ onSubmit, className, children }: FormProps) {
  return (
    <form className={classNames('formSection', className)} method="post" noValidate onSubmit={onSubmit}>
      {children}
    </form>
  )
}
