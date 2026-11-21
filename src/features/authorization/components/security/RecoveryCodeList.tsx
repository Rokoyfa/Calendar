import { Button } from '../../../../components/Button.tsx'
import { useI18n } from '../../../../i18n/index.ts'
import { saveBlob } from '../../../../utils/download.ts'
import { recoveryCodesFile } from '../../utils/twoFactor.ts'
import { CopyButton } from '../../../../components/CopyButton.tsx'

const FILE_NAME = 'recovery-codes.txt'

export function RecoveryCodeList({ codes }: { codes: readonly string[] }) {
  const { m } = useI18n()
  const text = m.security.twoFactor

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
        <CopyButton value={codes.join('\n')} />
        <Button variant="outline" onClick={() => saveBlob(recoveryCodesFile(codes, text.recoveryTitle), FILE_NAME)}>
          {text.download}
        </Button>
      </div>
    </div>
  )
}
