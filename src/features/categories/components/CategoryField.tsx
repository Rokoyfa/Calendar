import { ChoiceChip } from '../../../components/ChoiceChip.tsx'
import { FormField } from '../../../components/FormField.tsx'
import { useI18n } from '../../../i18n/index.ts'
import { MAX_EVENT_CATEGORIES, type Category } from '../../../utils/category.ts'

type CategoryFieldProps = {
  categories: readonly Category[]
  value: readonly string[]
  onChange: (categoryIds: string[]) => void
}

export function CategoryField({ categories, value, onChange }: CategoryFieldProps) {
  const { m } = useI18n()
  if (categories.length === 0) return null
  const chosen = categories.filter((category) => value.includes(category.id)).map((category) => category.id)
  const isFull = chosen.length >= MAX_EVENT_CATEGORIES

  const toggle = (id: string) =>
    onChange(chosen.includes(id) ? chosen.filter((entry) => entry !== id) : isFull ? chosen : [...chosen, id])

  return (
    <FormField as="fieldset" label={m.events.categories.label}>
      <div className="choiceList">
        {categories.map((category) => (
          <ChoiceChip
            key={category.id}
            type="checkbox"
            name="eventCategory"
            label={category.name}
            checked={chosen.includes(category.id)}
            onChange={() => toggle(category.id)}
            className="categoryChip"
          >
            {category.name}
          </ChoiceChip>
        ))}
      </div>
    </FormField>
  )
}
