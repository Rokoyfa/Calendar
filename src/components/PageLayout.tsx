import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ROUTES } from '../config/routes.ts'

type PageLayoutProps = {
  title: string
  variant?: 'card' | 'full'
  footer?: ReactNode
  children: ReactNode
}

const BackLink = () => (
  <Link to={ROUTES.calendar} className="pageBack">
    ← Zum Kalender
  </Link>
)

export function PageLayout({ title, variant = 'card', footer, children }: PageLayoutProps) {
  if (variant === 'full')
    return (
      <div className="pageFull">
        <header className="pageHeader">
          <BackLink />
          <h1 className="pageTitle">{title}</h1>
        </header>
        <main className="pageContent">
          {children}
          {footer && <p className="pageFooter">{footer}</p>}
        </main>
      </div>
    )

  return (
    <main className="page">
      <div className="pageCard surface">
        <BackLink />
        <h1 className="pageTitle">{title}</h1>
        {children}
        {footer && <p className="pageFooter">{footer}</p>}
      </div>
    </main>
  )
}
