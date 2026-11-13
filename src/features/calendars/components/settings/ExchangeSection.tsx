import { useCallback, useMemo, useState, type ChangeEvent } from 'react'
import { Button } from '../../../../components/Button.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { ActionFeedback } from '../../../../components/StatusMessage.tsx'
import { useHost } from '../../../../context/HostContext.ts'
import { useAsyncAction } from '../../../../hooks/useAsyncAction.ts'
import { useI18n } from '../../../../i18n/index.ts'
import { classNames } from '../../../../utils/classNames.ts'
import { parseICalendar, toICalendar } from '../../../../utils/ical.ts'
import { useCategories } from '../../../categories/index.ts'
import { createCategoryResolver, importEvents, listAllEvents } from '../../../events/index.ts'
import { useStorage } from '../../../storage/index.ts'
import type { CalendarSummary } from '../../types/calendar.ts'
import { canManageCategories, hasPermission } from '../../utils/permissions.ts'

const toFileName = (name: string) => `${name.replace(/[\\/:*?"<>|]+/g, '').trim() || 'calendar'}.ics`

const download = (content: string, fileName: string) => {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.hidden = true
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function ExchangeSection({ calendar }: { calendar: CalendarSummary }) {
  const { m } = useI18n()
  const { ical } = m.calendars
  const { readOnly = false } = useHost()
  const { events: repository, categories: categoryRepository, invalidate } = useStorage()
  const calendarIds = useMemo(() => [calendar.id], [calendar.id])
  const { isAvailable: hasCategories, categories } = useCategories(calendarIds)
  const canManage = canManageCategories(calendar)
  const [result, setResult] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const exportEvents = useCallback(async () => {
    setResult(null)
    setFileError(null)
    const events = await listAllEvents(repository, calendar.id)
    if (events.length === 0) {
      setResult(ical.noEvents)
      return
    }
    const categoryNames = new Map(categories.map((category) => [category.id, category.name]))
    download(toICalendar(events, calendar.name, { categoryNames }), toFileName(calendar.name))
  }, [repository, calendar, ical, categories])

  const importFile = useCallback(
    async (file: File) => {
      setResult(null)
      setFileError(null)
      const parsed = parseICalendar(await file.text())
      if (!parsed) {
        setFileError(ical.importFailed)
        return
      }
      const resolver =
        hasCategories && categoryRepository
          ? createCategoryResolver(
              await categoryRepository.list([calendar.id]),
              canManage ? (name) => categoryRepository.create(calendar.id, name) : null,
            )
          : undefined
      const summary = await importEvents(repository, calendar.id, parsed.events, m, resolver)
      invalidate()
      const skipped = parsed.skipped + summary.skipped
      setResult(
        [ical.imported(summary.created, summary.updated), skipped > 0 ? ical.skipped(skipped) : null]
          .filter(Boolean)
          .join(' '),
      )
    },
    [repository, categoryRepository, hasCategories, canManage, calendar.id, invalidate, ical, m],
  )

  const exporting = useAsyncAction(exportEvents)
  const importing = useAsyncAction(importFile)

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) void importing.run(file)
  }

  return (
    <PageSection title={ical.title} description={ical.description}>
      <div className="buttonRow">
        <Button
          variant="outline"
          isPending={exporting.isPending}
          pendingLabel={ical.exporting}
          onClick={() => void exporting.run()}
        >
          {ical.exportLabel}
        </Button>
        {!readOnly && hasPermission(calendar, 'create_entry') && (
          <label className={classNames('button', 'button--outline', importing.isPending && 'isDisabled')}>
            {importing.isPending ? ical.importing : ical.importLabel}
            <input
              type="file"
              accept=".ics,text/calendar"
              hidden
              disabled={importing.isPending}
              onChange={handleFile}
            />
          </label>
        )}
      </div>
      <ActionFeedback error={fileError ?? exporting.error ?? importing.error} success={result} />
    </PageSection>
  )
}
