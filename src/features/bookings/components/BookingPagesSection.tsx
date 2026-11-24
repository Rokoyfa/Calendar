import { useMemo, useState } from 'react'
import { AsyncSwitch } from '../../../components/AsyncSwitch.tsx'
import { Button } from '../../../components/Button.tsx'
import { ConfirmModal } from '../../../components/ConfirmModal.tsx'
import { CopyButton } from '../../../components/CopyButton.tsx'
import { ManagedListSection } from '../../../components/ManagedListSection.tsx'
import { useHost } from '../../../context/HostContext.ts'
import { useViewerTimeZone } from '../../../context/TimeZoneContext.ts'
import { useI18n } from '../../../i18n/index.ts'
import {
  buildBookingLink,
  defaultBookingSettings,
  getBookingPath,
  MAX_BOOKING_PAGES,
  type BookingPage,
  type BookingPageSettings,
} from '../../../utils/booking.ts'
import type { BookingRepository } from '../../storage/index.ts'
import { useBookingPages } from '../hooks/useBookingPages.ts'
import { BookingPageForm, type BookingFormValues } from './BookingPageForm.tsx'

type BookingPages = ReturnType<typeof useBookingPages>

const formValuesOf = (settings: BookingPageSettings): BookingFormValues => ({
  title: settings.title,
  description: settings.description,
  location: settings.location,
  durationMinutes: settings.durationMinutes,
  bufferMinutes: settings.bufferMinutes,
  minNoticeMinutes: settings.minNoticeMinutes,
  horizonDays: settings.horizonDays,
  maxPerDay: settings.maxPerDay,
  stepMinutes: settings.stepMinutes,
  timeZone: settings.timeZone,
  hours: settings.hours,
})

function BookingPageRow({ page, pages, onRemove }: { page: BookingPage; pages: BookingPages; onRemove: () => void }) {
  const i18n = useI18n()
  const text = i18n.m.bookings
  const { links } = useHost()
  const [isEditing, setIsEditing] = useState(false)
  const [isRenewing, setIsRenewing] = useState(false)
  const url = buildBookingLink(page.token, links, window.location.href)
  const link = url ?? getBookingPath(page.token)
  const initialValues = useMemo(() => formValuesOf(page), [page])

  return (
    <li className="calendarSettingCard">
      <div className="calendarSettingHeader">
        <span className="itemRowMain">
          <span className="itemRowTitle">{page.title}</span>
          <span className="itemRowMeta">
            {text.meta(i18n.format.duration(page.durationMinutes), page.timeZone.replaceAll('_', ' '))}
          </span>
        </span>
        {!page.active && <span className="badge">{text.inactive}</span>}
      </div>
      <div className="calendarSettingBody">
        <AsyncSwitch
          label={text.active}
          checked={page.active}
          onChange={async (active) => {
            await pages.change(page.id, { active })
          }}
        />
        <label className="field">
          <span className="descriptor">{url ? text.link : text.pathLabel}</span>
          <input className="input feedUrl" readOnly value={link} onFocus={(event) => event.target.select()} />
        </label>
        <div className="buttonRow">
          <CopyButton value={link} label={text.copy} />
          {url && (
            <a className="button button--outline" href={url} target="_blank" rel="noopener noreferrer">
              {text.open}
            </a>
          )}
        </div>
        {isEditing ? (
          <BookingPageForm
            initialValues={initialValues}
            submitLabel={text.save}
            pendingLabel={text.saving}
            successText={text.saved}
            onSubmit={async (values) => {
              await pages.change(page.id, values)
              setIsEditing(false)
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="formActions">
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              {text.edit}
            </Button>
            <Button variant="outline" onClick={() => setIsRenewing(true)}>
              {text.renew}
            </Button>
            <Button variant="dangerOutline" onClick={onRemove}>
              {text.remove}
            </Button>
          </div>
        )}
      </div>
      {isRenewing && (
        <ConfirmModal
          title={text.renewTitle}
          confirmLabel={text.renew}
          pendingLabel={text.renewing}
          onConfirm={async () => {
            await pages.renew(page.id)
          }}
          onClose={() => setIsRenewing(false)}
        >
          {text.renewMessage}
        </ConfirmModal>
      )}
    </li>
  )
}

export function BookingPagesSection({ calendarId, repository }: { calendarId: string; repository: BookingRepository }) {
  const { m } = useI18n()
  const text = m.bookings
  const timeZone = useViewerTimeZone()
  const pages = useBookingPages(repository, calendarId)
  const items = useMemo(() => pages.pages.map((page) => ({ ...page, name: page.title })), [pages.pages])
  const initialValues = useMemo(() => formValuesOf(defaultBookingSettings(timeZone)), [timeZone])

  return (
    <ManagedListSection
      texts={text}
      items={items}
      max={MAX_BOOKING_PAGES}
      error={pages.error}
      onRemove={(item) => pages.remove(item.id)}
      addForm={
        <>
          <h3 className="formSubtitle">{text.addTitle}</h3>
          <BookingPageForm
            initialValues={initialValues}
            submitLabel={text.add}
            pendingLabel={text.adding}
            successText={text.added}
            resetOnSuccess
            onSubmit={async (values) => {
              await pages.create({ ...values, active: true })
            }}
          />
        </>
      }
    >
      {(item, askRemove) => <BookingPageRow key={item.id} page={item} pages={pages} onRemove={askRemove} />}
    </ManagedListSection>
  )
}
