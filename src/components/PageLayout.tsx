import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ROUTES } from '../config/routes.ts'
import { useI18n } from '../i18n/index.ts'

type PageLayoutProps = {
  title: string
  back?: { to: string; label: string }
  variant?: 'card' | 'full'
  footer?: ReactNode
  children: ReactNode
}

export function PageLayout({ title, back, variant = 'card', footer, children }: PageLayoutProps) {
  const { m } = useI18n()
  const backLink = back ?? { to: ROUTES.calendar, label: m.common.backToCalendar }
  const heading = (
    <>
      <Link to={backLink.to} className="pageBack">
        ← {backLink.label}
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
