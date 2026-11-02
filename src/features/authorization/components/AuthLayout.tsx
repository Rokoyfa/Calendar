import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ROUTES } from '../../../config/routes.ts'

type AuthLayoutProps = {
  title: string
  footer: ReactNode
  children: ReactNode
}

export function AuthLayout({ title, footer, children }: AuthLayoutProps) {
  return (
    <main className="authPage">
      <div className="authCard surface">
        <Link to={ROUTES.calendar} className="authBack">
          ← Zum Kalender
        </Link>
        <h1 className="authTitle">{title}</h1>
        {children}
        <p className="authFooter">{footer}</p>
      </div>
    </main>
  )
}
