import type { ReactNode } from 'react'
import { Button } from '../../../../components/Button.tsx'
import { CopyButton } from '../../../../components/CopyButton.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { ActionFeedback } from '../../../../components/StatusMessage.tsx'
import type { SecretLink } from '../../hooks/useSecretLink.ts'

type SecretLinkTexts = {
  title: string
  description: string
  create: string
  copy: string
  warning: string
  renew: string
  remove: string
}

type SecretLinkSectionProps = {
  texts: SecretLinkTexts
  link: SecretLink
  field: { label: string; value: string } | null
  openAction?: ReactNode
}

export function SecretLinkSection({ texts, link, field, openAction }: SecretLinkSectionProps) {
  if (!link.isAvailable) return null

  return (
    <PageSection title={texts.title} description={texts.description}>
      {field ? (
        <>
          <label className="field">
            <span className="descriptor">{field.label}</span>
            <input className="input feedUrl" readOnly value={field.value} onFocus={(event) => event.target.select()} />
          </label>
          <div className="buttonRow">
            <CopyButton value={field.value} label={texts.copy} />
            {openAction}
          </div>
          <p className="formHint">{texts.warning}</p>
          <div className="buttonRow">
            <Button variant="outline" isPending={link.create.isPending} onClick={() => void link.create.run()}>
              {texts.renew}
            </Button>
            <Button variant="danger" isPending={link.remove.isPending} onClick={() => void link.remove.run()}>
              {texts.remove}
            </Button>
          </div>
        </>
      ) : (
        <div className="buttonRow">
          <Button isPending={link.create.isPending} onClick={() => void link.create.run()}>
            {texts.create}
          </Button>
        </div>
      )}
      <ActionFeedback error={link.error} />
    </PageSection>
  )
}
