import { Fragment } from 'react'
import { Modal } from '../../../components/Modal.tsx'
import { useI18n } from '../../../i18n/index.ts'
import { compact } from '../../../utils/list.ts'
import { modifierKey } from '../../../utils/shortcutLabel.ts'
import { VIEW_SHORTCUTS } from '../constants/views.ts'
import type { CalendarView } from '../types/view.ts'

type ShortcutHelpProps = {
  views: readonly CalendarView[]
  canNavigate: boolean
  canCreate: boolean
  hasSearch: boolean
  hasUndo: boolean
  hasFilter: boolean
  hasPrint: boolean
  canSwitchCalendar: boolean
  hasDuplicate: boolean
  onClose: () => void
}

type Row = { keys: readonly (readonly string[])[]; label: string }

const one = (...keys: string[]) => [keys]

export function ShortcutHelp({
  views,
  canNavigate,
  canCreate,
  hasSearch,
  hasUndo,
  hasFilter,
  hasPrint,
  canSwitchCalendar,
  hasDuplicate,
  onClose,
}: ShortcutHelpProps) {
  const { m } = useI18n()
  const text = m.calendar.shortcutHelp
  const mod = modifierKey(text.ctrl)
  const groups: { title: string; hint?: string; rows: Row[] }[] = [
    {
      title: text.navigation,
      rows: compact<Row>([
        canNavigate && { keys: one('←', '→'), label: text.previousNext },
        canNavigate && { keys: one('T'), label: m.calendar.today },
        canNavigate && { keys: one('G'), label: m.calendar.jump.open },
        canSwitchCalendar && { keys: one('S'), label: m.calendars.switcher.open },
        { keys: one('↑', '↓', '←', '→'), label: text.moveFocus },
      ]),
    },
    {
      title: m.views.label,
      rows: [
        ...views.map((view) => ({
          keys: view === 'year' ? [['Y'], ['J']] : one(VIEW_SHORTCUTS[view].toUpperCase()),
          label: m.views[view].label,
        })),
        ...(views.length > 1 ? [{ keys: one(`1–${Math.min(views.length, 9)}`), label: text.viewByNumber }] : []),
      ],
    },
    {
      title: text.events,
      hint: text.eventsHint,
      rows: compact<Row>([
        { keys: one('↵'), label: text.openPreview },
        { keys: one('E'), label: m.calendar.peek.edit },
        hasDuplicate && { keys: one(mod, 'D'), label: m.events.duplicate },
        { keys: one(text.deleteKey), label: m.common.delete },
        { keys: [[text.homeKey], [text.endKey]], label: text.firstLast },
      ]),
    },
    {
      title: text.actions,
      rows: compact<Row>([
        canCreate && { keys: one('N'), label: m.calendar.newEvent },
        hasSearch && { keys: [['/'], [mod, 'K']], label: m.calendar.search.open },
        hasFilter && { keys: one('F'), label: m.calendar.filter.title },
        hasPrint && { keys: one(mod, 'P'), label: m.calendar.print.open },
        { keys: one('R'), label: text.refresh },
        hasUndo && { keys: one(mod, 'Z'), label: text.undo },
        { keys: one(mod, '↵'), label: text.saveForm },
        { keys: one('Esc'), label: m.common.close },
        { keys: one('?'), label: text.title },
      ]),
    },
  ].filter((group) => group.rows.length > 0)

  return (
    <Modal title={text.title} size="large" onClose={onClose}>
      <div className="shortcutHelp">
        {groups.map((group) => (
          <section key={group.title} className="shortcutGroup">
            <h3 className="shortcutGroupTitle">{group.title}</h3>
            {group.hint && <p className="shortcutGroupHint">{group.hint}</p>}
            <dl className="shortcutList">
              {group.rows.map((row) => (
                <div key={row.label} className="shortcutRow">
                  <dt>
                    {row.keys.map((combo, index) => (
                      <Fragment key={combo.join('+')}>
                        {index > 0 && <span className="shortcutOr">{text.or}</span>}
                        {combo.map((key) => (
                          <kbd key={key}>{key}</kbd>
                        ))}
                      </Fragment>
                    ))}
                  </dt>
                  <dd>{row.label}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Modal>
  )
}
