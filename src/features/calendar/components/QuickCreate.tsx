import { useState, type FormEvent } from 'react'
import { AnchoredPopover, type PopoverAnchor } from '../../../components/AnchoredPopover.tsx'
import { Button } from '../../../components/Button.tsx'
import { EVENT_TITLE_MAX_LENGTH, formatEventPeriod, type EventInput } from '../../../domain/event.ts'
import { useI18n } from '../../../i18n/index.ts'
import { Input } from '../../../components/Input.tsx'

type QuickCreateProps = {
  draft: EventInput
  anchor: PopoverAnchor
  calendarName?: string
  onTitleChange: (title: string) => void
  onSave: (title: string) => Promise<boolean>
  onMore: (title: string) => void
  onClose: () => void
}

export function QuickCreate({ draft, anchor, calendarName, onTitleChange, onSave, onMore, onClose }: QuickCreateProps) {
  const i18n = useI18n()
  const text = i18n.m.calendar.quickCreate
  const [isSaving, setIsSaving] = useState(false)
  const title = draft.title
  const canSave = title.trim().length > 0 && !isSaving

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSave) return
    setIsSaving(true)
    const saved = await onSave(title.trim())
    setIsSaving(false)
    if (saved) onClose()
  }

  return (
    <AnchoredPopover anchor={anchor} label={i18n.m.calendar.newEvent} className="quickCreate" onClose={onClose}>
      <form className="quickCreateForm" onSubmit={(event) => void submit(event)}>
        <Input
          className="quickCreateTitle"
          name="title"
          autoComplete="off"
          data-autofocus
          maxLength={EVENT_TITLE_MAX_LENGTH}
          placeholder={text.title}
          aria-label={i18n.m.events.title}
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
        />
        <p className="quickCreateWhen">{formatEventPeriod(draft, i18n)}</p>
        {calendarName && <p className="quickCreateCalendar">{text.inCalendar(calendarName)}</p>}
        <div className="quickCreateActions">
          <Button variant="secondary" onClick={() => onMore(title)}>
            {text.more}
          </Button>
          <Button type="submit" disabled={!canSave} isPending={isSaving}>
            {i18n.m.common.save}
          </Button>
        </div>
      </form>
    </AnchoredPopover>
  )
}
