import { Button } from '../../../../components/Button.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { ErrorMessage } from '../../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../../hooks/useAsyncAction.ts'
import { useI18n } from '../../../../i18n/index.ts'
import { saveBlob } from '../../../../utils/download.ts'
import { collectLocalData, exportFileName, toJsonBlob } from '../../utils/dataExport.ts'
import { toISODate } from '../../../../utils/date.ts'
import { useAuth } from '../../hooks/useAuth.ts'

export function DataExportSection() {
  const { m } = useI18n()
  const text = m.settings.dataExport
  const { user, exportData } = useAuth()
  const fromAccount = user !== null && exportData !== null
  const { run, isPending, error } = useAsyncAction(async () => {
    const blob = fromAccount ? await exportData() : toJsonBlob(collectLocalData(localStorage))
    saveBlob(blob, exportFileName(toISODate(new Date())))
  })

  if (user !== null && !fromAccount) return null

  return (
    <PageSection title={text.title} description={fromAccount ? text.accountDescription : text.localDescription}>
      <ErrorMessage message={error} />
      <div className="buttonRow">
        <Button variant="outline" isPending={isPending} onClick={() => void run()}>
          {text.download}
        </Button>
      </div>
    </PageSection>
  )
}
