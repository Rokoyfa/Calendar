import { useState } from 'react'
import { Button } from '../../../../components/Button.tsx'
import { Form } from '../../../../components/Form.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { ActionFeedback } from '../../../../components/StatusMessage.tsx'
import { useForm } from '../../../../hooks/useForm.ts'
import { useI18n } from '../../../../i18n/index.ts'
import type { SecurityActions, TwoFactorSetup as Setup } from '../../types/auth.ts'
import { formatSecret, isTwoFactorCode, normalizeTwoFactorCode } from '../../utils/twoFactor.ts'
import { CurrentPasswordField } from '../AuthFields.tsx'
import { QrCode } from './QrCode.tsx'
import { RecoveryCodeList } from './RecoveryCodeList.tsx'
import { TwoFactorCodeField } from './TwoFactorCodeField.tsx'

type TwoFactorSetupProps = {
  security: SecurityActions
  onEnabled: () => Promise<void>
}

export function TwoFactorSetup({ security, onEnabled }: TwoFactorSetupProps) {
  const { m } = useI18n()
  const text = m.security.twoFactor
  const [setup, setSetup] = useState<Setup | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)

  const start = useForm({
    initialValues: { password: '' },
    validate: ({ password }) => (password ? {} : { password: m.auth.validation.passwordRequired }),
    onSubmit: async ({ password }) => setSetup(await security.startTwoFactorSetup(password)),
  })

  const confirm = useForm({
    initialValues: { code: '' },
    validate: ({ code }) => (isTwoFactorCode(code) ? {} : { code: text.invalidCode }),
    onSubmit: async ({ code }) => setRecoveryCodes(await security.confirmTwoFactor(normalizeTwoFactorCode(code))),
  })

  const finish = useForm({ initialValues: {}, validate: () => ({}), onSubmit: onEnabled })

  if (recoveryCodes)
    return (
      <PageSection title={text.recoveryTitle} description={text.enabledNotice}>
        <RecoveryCodeList codes={recoveryCodes} />
        <Form onSubmit={finish.handleSubmit}>
          <ActionFeedback error={finish.error} />
          <div className="formActions">
            <Button type="submit" isPending={finish.isPending}>
              {text.done}
            </Button>
          </div>
        </Form>
      </PageSection>
    )

  if (setup)
    return (
      <PageSection title={text.scanTitle} description={text.scanDescription}>
        <div className="twoFactorSetup">
          <QrCode value={setup.otpauthUri} label={text.qrLabel} />
          <div className="twoFactorSecret">
            <span className="formHint">{text.secretLabel}</span>
            <code>{formatSecret(setup.secret)}</code>
          </div>
        </div>
        <Form onSubmit={confirm.handleSubmit}>
          <TwoFactorCodeField {...confirm.bind('code')} autoFocus />
          <ActionFeedback error={confirm.error} />
          <div className="formActions">
            <Button variant="secondary" onClick={() => setSetup(null)}>
              {m.common.cancel}
            </Button>
            <Button type="submit" isPending={confirm.isPending} pendingLabel={text.checking}>
              {text.enable}
            </Button>
          </div>
        </Form>
      </PageSection>
    )

  return (
    <PageSection title={text.setUpTitle} description={text.setUpDescription}>
      <Form onSubmit={start.handleSubmit}>
        <CurrentPasswordField {...start.bind('password')} autoFocus />
        <ActionFeedback error={start.error} />
        <div className="formActions">
          <Button type="submit" isPending={start.isPending} pendingLabel={text.preparing}>
            {text.start}
          </Button>
        </div>
      </Form>
    </PageSection>
  )
}
