import type { ReactNode } from 'react'
import { classNames } from '../utils/classNames.ts'

type PageSectionProps = {
  title: string
  description?: ReactNode
  tone?: 'default' | 'danger'
  children: ReactNode
}

export function PageSection({ title, description, tone = 'default', children }: PageSectionProps) {
  return (
    <section className={classNames('pageSection', tone === 'danger' && 'pageSection--danger')}>
      <div className="pageSectionIntro">
        <h2 className="pageSectionTitle">{title}</h2>
        {description && <p className="formHint">{description}</p>}
      </div>
      <div className="pageSectionBody">{children}</div>
    </section>
  )
}
