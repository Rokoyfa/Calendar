import type { ReactNode } from 'react'
import { classNames } from '../utils/classNames.ts'
import { ExternalLink } from './ExternalLink.tsx'

type IconLinkProps = {
  href: string
  label: string
  className?: string
  children: ReactNode
}

export function IconLink({ href, label, className, children }: IconLinkProps) {
  return (
    <ExternalLink
      className={classNames('iconButton', 'iconButton--plain', className)}
      href={href}
      aria-label={label}
      title={label}
    >
      {children}
    </ExternalLink>
  )
}
