import { TextField } from '../../../../components/TextField.tsx'
import { useI18n } from '../../../../i18n/index.ts'

type TwoFactorCodeFieldProps = {
  value: string
  error?: string
  recovery?: boolean
  autoFocus?: boolean
  onChange: (value: string) => void
}

export function TwoFactorCodeField({ recovery = false, ...props }: TwoFactorCodeFieldProps) {
  const { m } = useI18n()
  const text = m.security.twoFactor
  return recovery ? (
    <TextField
      {...props}
      label={text.recoveryCode}
      name="recoveryCode"
      autoComplete="off"
      spellCheck={false}
      maxLength={32}
    />
  ) : (
    <TextField
      {...props}
      label={text.code}
      name="code"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9 ]*"
      maxLength={7}
      placeholder={text.codePlaceholder}
    />
  )
}
