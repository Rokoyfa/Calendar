import { Button } from '../../../components/Button.tsx'
import { Modal } from '../../../components/Modal.tsx'
import { useI18n } from '../../../i18n/index.ts'
import { toggleCategoryFilter, UNCATEGORIZED, type Category, type CategoryFilter } from '../../../utils/category.ts'

type CategoryFilterModalProps = {
  categories: readonly Category[]
  calendarNames: ReadonlyMap<string, string>
  value: CategoryFilter
  onChange: (filter: CategoryFilter) => void
  onClose: () => void
}

export function CategoryFilterModal({ categories, calendarNames, value, onChange, onClose }: CategoryFilterModalProps) {
  const { m } = useI18n()
  const { filter } = m.calendar
  const showCalendar = new Set(categories.map((category) => category.calendarId)).size > 1
  const options = [
    ...categories.map((category) => {
      const calendar = showCalendar ? calendarNames.get(category.calendarId) : undefined
      return { id: category.id, label: calendar ? `${category.name} · ${calendar}` : category.name }
    }),
    { id: UNCATEGORIZED, label: filter.uncategorized },
  ]
  const ids = options.map((option) => option.id)

  return (
    <Modal title={filter.title} onClose={onClose}>
      <ul className="categoryFilter">
        {options.map((option) => (
          <li key={option.id}>
            <label className="checkRow">
              <input
                type="checkbox"
                name="categoryFilter"
                checked={value === null || value.has(option.id)}
                onChange={() => onChange(toggleCategoryFilter(value, ids, option.id))}
              />
              <span>{option.label}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="modalActions">
        <Button onClick={onClose} data-autofocus>
          {m.common.close}
        </Button>
        <Button variant="outline" disabled={value === null} onClick={() => onChange(null)}>
          {filter.reset}
        </Button>
      </div>
    </Modal>
  )
}
