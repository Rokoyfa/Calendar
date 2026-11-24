import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { IconButton } from '../../../components/IconButton.tsx'
import { MenuIcon } from '../../../components/Icons.tsx'
import { Modal } from '../../../components/Modal.tsx'
import { useI18n } from '../../../i18n/index.ts'
import { classNames } from '../../../utils/classNames.ts'

export type CalendarMenuItem = {
  key: string
  label: string
  icon: ReactNode
  shortcut?: string
  badge?: string
  group?: string
} & ({ onSelect: () => void; to?: never } | { to: string; onSelect?: never })

type CalendarMenuProps = {
  items: readonly CalendarMenuItem[]
  isMarked?: boolean
}

function ItemContent({ item }: { item: CalendarMenuItem }) {
  return (
    <>
      <span className="drawerMenuIcon">{item.icon}</span>
      <span className="drawerMenuLabel">{item.label}</span>
      {item.badge && <span className="badge">{item.badge}</span>}
      {item.shortcut && <kbd className="drawerMenuShortcut">{item.shortcut}</kbd>}
    </>
  )
}

type MenuGroup = { label: string | undefined; entries: CalendarMenuItem[] }

const groupItems = (items: readonly CalendarMenuItem[]) =>
  items.reduce<MenuGroup[]>((groups, item) => {
    const last = groups.at(-1)
    if (last && last.label === item.group) last.entries.push(item)
    else groups.push({ label: item.group, entries: [item] })
    return groups
  }, [])

export function CalendarMenu({ items, isMarked = false }: CalendarMenuProps) {
  const { m } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  if (items.length === 0) return null
  const close = () => setIsOpen(false)

  return (
    <>
      <span className={classNames('filterButton', isMarked && 'filterButton--active')}>
        <IconButton
          label={isMarked ? m.calendar.menu.openMarked : m.calendar.menu.open}
          plain
          opensDialog
          expanded={isOpen}
          onClick={() => setIsOpen(true)}
        >
          <MenuIcon size={20} />
        </IconButton>
      </span>
      {isOpen && (
        <Modal title={m.calendar.menu.title} placement="start" onClose={close}>
          <nav aria-label={m.calendar.menu.title} className="drawerMenuNav">
            {groupItems(items).map(({ label, entries }) => (
              <section key={label ?? ''} className="drawerMenuGroup">
                {label && <h3 className="drawerMenuGroupTitle">{label}</h3>}
                <ul className="drawerMenu">
                  {entries.map((item) => (
                    <li key={item.key}>
                      {item.to !== undefined ? (
                        <Link to={item.to} className="drawerMenuItem" onClick={close}>
                          <ItemContent item={item} />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="drawerMenuItem"
                          onClick={() => {
                            close()
                            item.onSelect()
                          }}
                        >
                          <ItemContent item={item} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </nav>
        </Modal>
      )}
    </>
  )
}
