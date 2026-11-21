import { useState } from 'react'
import { Button } from '../../../../components/Button.tsx'
import { Form } from '../../../../components/Form.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { ActionFeedback } from '../../../../components/StatusMessage.tsx'
import { useForm } from '../../../../hooks/useForm.ts'
import { useI18n } from '../../../../i18n/index.ts'
import type { SecurityActions, TwoFactorState } from '../../types/auth.ts'
import {
  isRecoveryCode,
  isTwoFactorCode,
  normalizeRecoveryCode,
  normalizeTwoFactorCode,
} from '../../utils/twoFactor.ts'
import { CurrentPasswordField } from '../AuthFields.tsx'
import { RecoveryCodeList } from './RecoveryCodeList.tsx'
import { TwoFactorCodeField } from './TwoFactorCodeField.tsx'
import { FormActions } from '../../../../components/FormActions.tsx'

type TwoFactorManageProps = {
  security: SecurityActions
  state: TwoFactorState
  onChanged: () => Promise<void>
}

export function TwoFactorManage({ security, state, onChanged }: TwoFactorManageProps) {
  const { m } = useI18n()
  const text = m.security.twoFactor
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [useRecovery, setUseRecovery] = useState(false)

  const renew = useForm({
    initialValues: { password: '' },
    validate: ({ password }) => (password ? {} : { password: m.auth.validation.passwordRequired }),
    onSubmit: async ({ password }) => {
      setRecoveryCodes(await security.renewRecoveryCodes(password))
      renew.reset()
      await onChanged()
    },
  })

  const disable = useForm({
    initialValues: { password: '', code: '' },
    validate: ({ password, code }) => ({
      password: password ? undefined : m.auth.validation.passwordRequired,
      code: (useRecovery ? isRecoveryCode(code) : isTwoFactorCode(code))
        ? undefined
        : useRecovery
          ? text.invalidRecovery
          : text.invalidCode,
    }),
    onSubmit: async ({ password, code }) => {
      await security.disableTwoFactor(
        useRecovery
          ? { password, recoveryCode: normalizeRecoveryCode(code) }
          : { password, code: normalizeTwoFactorCode(code) },
      )
      await onChanged()
    },
  })

  return (
    <>
      <PageSection title={text.title} description={text.statusOn(state.recoveryCodesLeft)}>
        <p className="statusBadge statusBadge--on">{text.on}</p>
      </PageSection>
      <PageSection title={text.renewTitle} description={text.renewDescription}>
        {recoveryCodes ? (
          <>
            <RecoveryCodeList codes={recoveryCodes} />
            <div className="formActions">
              <Button variant="secondary" onClick={() => setRecoveryCodes(null)}>
                {text.done}
              </Button>
            </div>
          </>
        ) : (
          <Form onSubmit={renew.handleSubmit}>
            <CurrentPasswordField {...renew.bind('password')} />
            <ActionFeedback error={renew.error} />
            <FormActions
              isPending={renew.isPending}
              variant="outline"
              submitLabel={text.renew}
              pendingLabel={text.preparing}
            />
          </Form>
        )}
      </PageSection>
      <PageSection title={text.disableTitle} description={text.disableDescription} tone="danger">
        <Form onSubmit={disable.handleSubmit}>
          <CurrentPasswordField {...disable.bind('password')} />
          <TwoFactorCodeField key={String(useRecovery)} recovery={useRecovery} {...disable.bind('code')} />
          <button type="button" className="linkButton" onClick={() => setUseRecovery((current) => !current)}>
            {useRecovery ? text.useCode : text.useRecovery}
          </button>
          <ActionFeedback error={disable.error} />
          <FormActions
            isPending={disable.isPending}
            variant="danger"
            submitLabel={text.disable}
            pendingLabel={text.checking}
          />
        </Form>
      </PageSection>
    </>
  )
}
