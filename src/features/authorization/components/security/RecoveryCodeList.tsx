import { useState } from 'react'
import { Button } from '../../../../components/Button.tsx'
import { useI18n } from '../../../../i18n/index.ts'
import { saveBlob } from '../../../../utils/attachment.ts'
import { recoveryCodesFile } from '../../utils/twoFactor.ts'

const FILE_NAME = 'recovery-codes.txt'

export function RecoveryCodeList({ codes }: { codes: readonly string[] }) {
  const { m } = useI18n()
  const text = m.security.twoFactor
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(codes.join('\n'))
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="recoveryCodes">
      <p className="formHint">{text.recoveryHint}</p>
      <ol className="recoveryCodeList">
        {codes.map((code) => (
          <li key={code}>
            <code>{code}</code>
          </li>
        ))}
      </ol>
      <div className="buttonRow">
        <Button variant="outline" onClick={() => void copy()}>
          {copied ? text.copied : text.copy}
        </Button>
        <Button variant="outline" onClick={() => saveBlob(recoveryCodesFile(codes, text.recoveryTitle), FILE_NAME)}>
          {text.download}
        </Button>
      </div>
    </div>
  )
}
