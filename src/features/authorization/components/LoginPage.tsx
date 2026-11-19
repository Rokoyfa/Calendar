import { useState } from 'react'
import { Link } from 'react-router'
import { useFeatures } from '../../../context/HostContext.ts'
import { useI18n } from '../../../i18n/index.ts'
import { Button } from '../../../components/Button.tsx'
import { Form } from '../../../components/Form.tsx'
import { PageLayout } from '../../../components/PageLayout.tsx'
import { ActionFeedback } from '../../../components/StatusMessage.tsx'
import { ROUTES, withRedirect } from '../../../config/routes.ts'
import { useForm } from '../../../hooks/useForm.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { useRedirectTarget } from '../hooks/useRedirectTarget.ts'
import type { LoginInput } from '../types/auth.ts'
import { normalizeEmail, validateLogin } from '../utils/validation.ts'
import { CurrentPasswordField, EmailField } from './AuthFields.tsx'
import { TwoFactorLoginStep } from './security/TwoFactorLoginStep.tsx'

const EMPTY_LOGIN: LoginInput = { email: '', password: '' }

export function LoginPage() {
  const { m } = useI18n()
  const { login } = useAuth()
  const { registration } = useFeatures()
  const { redirectTo, continueToTarget } = useRedirectTarget()
  const [challenge, setChallenge] = useState<string | null>(null)
  const { bind, handleSubmit, isPending, error } = useForm({
    initialValues: EMPTY_LOGIN,
    validate: (input) => validateLogin(input, m),
    prepare: (input) => ({ ...input, email: normalizeEmail(input.email) }),
    onSubmit: async (input) => {
      const result = await login(input)
      if ('twoFactorRequired' in result) {
        setChallenge(result.challenge)
        return
      }
      await continueToTarget()
    },
  })

  if (challenge)
    return (
      <PageLayout title={m.security.twoFactor.loginTitle}>
        <TwoFactorLoginStep challenge={challenge} onDone={continueToTarget} onRestart={() => setChallenge(null)} />
      </PageLayout>
    )

  return (
    <PageLayout
      title={m.auth.login.title}
      footer={
        registration && (
          <>
            {m.auth.login.noAccount}{' '}
            <Link to={withRedirect(ROUTES.register, redirectTo)}>{m.auth.login.registerLink}</Link>
          </>
        )
      }
    >
      <Form onSubmit={handleSubmit}>
        <EmailField {...bind('email')} autoFocus />
        <CurrentPasswordField {...bind('password')} />
        <Link to={ROUTES.forgotPassword} className="formLink">
          {m.auth.login.forgotPassword}
        </Link>
        <ActionFeedback error={error} />
        <Button type="submit" block isPending={isPending} pendingLabel={m.auth.login.pending}>
          {m.auth.login.submit}
        </Button>
      </Form>
    </PageLayout>
  )
}
