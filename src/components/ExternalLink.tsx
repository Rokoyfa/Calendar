import type { AnchorHTMLAttributes } from 'react'

type ExternalLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'rel'>

export function ExternalLink(props: ExternalLinkProps) {
  return <a {...props} target="_blank" rel="noopener noreferrer" />
}
