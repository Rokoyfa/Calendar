import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ROUTES } from '../config/routes.ts'

type PageLayoutProps = {
  title: string
  variant?: 'card' | 'full'
  footer?: ReactNode
  children: ReactNode
}

export function PageLayout({ title, variant = 'card', footer, children }: PageLayoutProps) {
  const heading = (
    <>
      <Link to={ROUTES.calendar} className="pageBack">
        ← Zum Kalender
      </Link>
      <h1 className="pageTitle">{title}</h1>
    </>
  )
  const body = (
    <>
      {children}
      {footer && <p className="pageFooter">{footer}</p>}
    </>
  )

  if (variant === 'full')
    return (
      <div className="pageFull">
        <header className="pageHeader">{heading}</header>
        <main className="pageContent">{body}</main>
      </div>
    )

  return (
    <main className="page">
      <div className="pageCard surface">
        {heading}
        {body}
      </div>
    </main>
  )
}
