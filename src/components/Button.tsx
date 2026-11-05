import type { ButtonHTMLAttributes, ComponentProps } from 'react'
import { Link } from 'react-router'
import { classNames } from '../utils/classNames.ts'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success'

type ButtonStyleProps = {
  variant?: ButtonVariant
  block?: boolean
  className?: string
}

const getButtonClassName = ({ variant = 'primary', block, className }: ButtonStyleProps) =>
  classNames('button', variant !== 'primary' && `button--${variant}`, block && 'button--block', className)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonStyleProps & {
    isPending?: boolean
    pendingLabel?: string
    'data-autofocus'?: boolean
  }

export function Button({
  variant,
  block,
  className,
  isPending = false,
  pendingLabel,
  type = 'button',
  disabled,
  children,
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      {...buttonProps}
      type={type}
      className={getButtonClassName({ variant, block, className })}
      disabled={disabled || isPending}
    >
      {isPending && pendingLabel ? pendingLabel : children}
    </button>
  )
}

type ButtonLinkProps = ComponentProps<typeof Link> & ButtonStyleProps

export function ButtonLink({ variant, block, className, ...linkProps }: ButtonLinkProps) {
  return <Link {...linkProps} className={getButtonClassName({ variant, block, className })} />
}
