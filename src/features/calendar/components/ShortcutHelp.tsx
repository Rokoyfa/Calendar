import { Modal } from '../../../components/Modal.tsx'
import { useI18n } from '../../../i18n/index.ts'
import { compact } from '../../../utils/list.ts'
import { VIEW_SHORTCUTS } from '../constants/views.ts'
import type { CalendarView } from '../types/view.ts'

type ShortcutHelpProps = {
  views: readonly CalendarView[]
  canNavigate: boolean
  canCreate: boolean
  hasSearch: boolean
  hasUndo: boolean
  onClose: () => void
}

type Row = { keys: readonly string[]; label: string }

const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

export function ShortcutHelp({ views, canNavigate, canCreate, hasSearch, hasUndo, onClose }: ShortcutHelpProps) {
  const { m } = useI18n()
  const text = m.calendar.shortcutHelp
  const groups: { title: string; rows: Row[] }[] = [
    {
      title: text.navigation,
      rows: compact<Row>([
        canNavigate && { keys: ['←', '→'], label: text.previousNext },
        canNavigate && { keys: ['T'], label: m.calendar.today },
        { keys: ['↑', '↓', '←', '→'], label: text.moveFocus },
      ]),
    },
    {
      title: m.views.label,
      rows: views.map((view) => ({ keys: [VIEW_SHORTCUTS[view].toUpperCase()], label: m.views[view].label })),
    },
    {
      title: text.actions,
      rows: compact<Row>([
        canCreate && { keys: ['N'], label: m.calendar.newEvent },
        hasSearch && { keys: ['/'], label: m.calendar.search.open },
        hasUndo && { keys: [isMac() ? '⌘' : 'Strg', 'Z'], label: text.undo },
        { keys: ['Esc'], label: m.common.close },
        { keys: ['?'], label: text.title },
      ]),
    },
  ].filter((group) => group.rows.length > 0)

  return (
    <Modal title={text.title} onClose={onClose}>
      <div className="shortcutHelp">
        {groups.map((group) => (
          <section key={group.title} className="shortcutGroup">
            <h3 className="shortcutGroupTitle">{group.title}</h3>
            <dl className="shortcutList">
              {group.rows.map((row) => (
                <div key={row.label} className="shortcutRow">
                  <dt>
                    {row.keys.map((key) => (
                      <kbd key={key}>{key}</kbd>
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
