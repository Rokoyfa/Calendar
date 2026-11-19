import { useState } from 'react'
import { Button } from '../../../../components/Button.tsx'
import { Form } from '../../../../components/Form.tsx'
import { ActionFeedback } from '../../../../components/StatusMessage.tsx'
import { useForm } from '../../../../hooks/useForm.ts'
import { useI18n } from '../../../../i18n/index.ts'
import { isApiError } from '../../../../utils/apiError.ts'
import { useAuth } from '../../hooks/useAuth.ts'
import {
  isRecoveryCode,
  isTwoFactorCode,
  normalizeRecoveryCode,
  normalizeTwoFactorCode,
} from '../../utils/twoFactor.ts'
import { TwoFactorCodeField } from './TwoFactorCodeField.tsx'

type TwoFactorLoginStepProps = {
  challenge: string
  onDone: () => void | Promise<void>
  onRestart: () => void
}

export function TwoFactorLoginStep({ challenge, onDone, onRestart }: TwoFactorLoginStepProps) {
  const { m } = useI18n()
  const text = m.security.twoFactor
  const { completeTwoFactorLogin } = useAuth()
  const [useRecovery, setUseRecovery] = useState(false)
  const { bind, handleSubmit, isPending, error, reset } = useForm({
    initialValues: { code: '' },
    validate: ({ code }) =>
      useRecovery
        ? isRecoveryCode(code)
          ? {}
          : { code: text.invalidRecovery }
        : isTwoFactorCode(code)
          ? {}
          : { code: text.invalidCode },
    onSubmit: async ({ code }) => {
      try {
        await completeTwoFactorLogin(
          useRecovery
            ? { challenge, recoveryCode: normalizeRecoveryCode(code) }
            : { challenge, code: normalizeTwoFactorCode(code) },
        )
      } catch (caught) {
        if (isApiError(caught) && caught.code === 'twoFactorExpired') onRestart()
        throw caught
      }
      await onDone()
    },
  })

  const switchMode = () => {
    setUseRecovery((current) => !current)
    reset()
  }

  return (
    <Form onSubmit={handleSubmit}>
      <p className="formHint">{useRecovery ? text.loginRecoveryDescription : text.loginDescription}</p>
      <TwoFactorCodeField key={String(useRecovery)} recovery={useRecovery} {...bind('code')} autoFocus />
      <ActionFeedback error={error} />
      <Button type="submit" block isPending={isPending} pendingLabel={text.checking}>
        {text.loginSubmit}
      </Button>
      <div className="buttonRow buttonRow--spread">
        <button type="button" className="linkButton" onClick={switchMode}>
          {useRecovery ? text.useCode : text.useRecovery}
        </button>
        <button type="button" className="linkButton" onClick={onRestart}>
          {text.backToLogin}
        </button>
      </div>
    </Form>
  )
}
