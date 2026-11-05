import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ROUTES } from '../config/routes.ts'

type PageLayoutProps = {
  title: string
  back?: { to: string; label: string }
  variant?: 'card' | 'full'
  footer?: ReactNode
  children: ReactNode
}

const DEFAULT_BACK = { to: ROUTES.calendar, label: 'Zum Kalender' }

export function PageLayout({ title, back = DEFAULT_BACK, variant = 'card', footer, children }: PageLayoutProps) {
  const heading = (
    <>
      <Link to={back.to} className="pageBack">
        ← {back.label}
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
