import { useState, type KeyboardEvent } from 'react'
import { Button } from '../../../components/Button.tsx'
import { ChoiceChip } from '../../../components/ChoiceChip.tsx'
import { FormField } from '../../../components/FormField.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useI18n } from '../../../i18n/index.ts'
import {
  CATEGORY_NAME_MAX_LENGTH,
  MAX_CATEGORIES,
  MAX_EVENT_CATEGORIES,
  normalizeCategoryName,
  type Category,
} from '../../../utils/category.ts'

type CategoryFieldProps = {
  categories: readonly Category[]
  value: readonly string[]
  onChange: (categoryIds: string[]) => void
  onCreate?: (name: string) => Promise<Category>
}

export function CategoryField({ categories, value, onChange, onCreate }: CategoryFieldProps) {
  const { m } = useI18n()
  const text = m.events.categories
  const [draft, setDraft] = useState<string | null>(null)
  const chosen = categories.filter((category) => value.includes(category.id)).map((category) => category.id)
  const isFull = chosen.length >= MAX_EVENT_CATEGORIES
  const canCreate = onCreate !== undefined && categories.length < MAX_CATEGORIES

  const creating = useAsyncAction(async () => {
    const name = normalizeCategoryName(draft ?? '')
    if (!name || !onCreate) return
    const category = await onCreate(name)
    setDraft(null)
    if (!isFull) onChange([...chosen, category.id])
  })

  if (categories.length === 0 && !canCreate) return null

  const toggle = (id: string) =>
    onChange(chosen.includes(id) ? chosen.filter((entry) => entry !== id) : isFull ? chosen : [...chosen, id])

  const handleKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      void creating.run()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      setDraft(null)
    }
  }

  return (
    <FormField as="fieldset" label={text.label}>
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
        {canCreate && draft === null && (
          <button type="button" className="categoryChip categoryAdd" onClick={() => setDraft('')}>
            + {text.add}
          </button>
        )}
      </div>
      {categories.length === 0 && draft === null && <p className="formHint">{text.empty}</p>}
      {draft !== null && (
        <div className="inlineForm">
          <input
            className="input"
            name="newEventCategory"
            aria-label={text.newLabel}
            placeholder={text.newLabel}
            maxLength={CATEGORY_NAME_MAX_LENGTH}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKey}
            autoFocus
          />
          <Button
            isPending={creating.isPending}
            disabled={!normalizeCategoryName(draft)}
            onClick={() => void creating.run()}
          >
            {text.create}
          </Button>
          <Button variant="secondary" onClick={() => setDraft(null)}>
            {m.common.cancel}
          </Button>
        </div>
      )}
      <ErrorMessage message={creating.error} />
    </FormField>
  )
}
