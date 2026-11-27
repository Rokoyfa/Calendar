import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ComponentProps, Ref } from 'react'
import { Link } from 'react-router'
import { classNames } from '../utils/classNames.ts'
import { ExternalLink } from './ExternalLink.tsx'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'dangerOutline'

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
    ref?: Ref<HTMLButtonElement>
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

type ExternalButtonLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'rel'> & ButtonStyleProps

export function ExternalButtonLink({ variant, block, className, ...linkProps }: ExternalButtonLinkProps) {
  return <ExternalLink {...linkProps} className={getButtonClassName({ variant, block, className })} />
}

type AnchorButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & ButtonStyleProps

export function AnchorButton({ variant, block, className, ...linkProps }: AnchorButtonProps) {
  return <a {...linkProps} className={getButtonClassName({ variant, block, className })} />
}
