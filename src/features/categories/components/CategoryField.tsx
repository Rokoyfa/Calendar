import { useState, type KeyboardEvent } from 'react'
import { AddChip } from '../../../components/AddChip.tsx'
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
  BUILTIN_CATEGORIES,
  normalizeCategoryName,
  type BuiltinCategory,
  type Category,
} from '../../../domain/category.ts'
import { Input } from '../../../components/Input.tsx'

type CategoryFieldProps = {
  categories: readonly Category[]
  value: readonly string[]
  builtin: readonly BuiltinCategory[]
  onChange: (categoryIds: string[]) => void
  onBuiltinChange: (builtinCategories: BuiltinCategory[]) => void
  onCreate?: (name: string) => Promise<Category>
}

export function CategoryField({ categories, value, builtin, onChange, onBuiltinChange, onCreate }: CategoryFieldProps) {
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

  const toggleBuiltin = (category: BuiltinCategory) =>
    onBuiltinChange(
      BUILTIN_CATEGORIES.filter((entry) => (entry === category ? !builtin.includes(entry) : builtin.includes(entry))),
    )

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
        {BUILTIN_CATEGORIES.map((category) => (
          <ChoiceChip
            key={category}
            type="checkbox"
            name="builtinCategory"
            label={text.builtin[category]}
            checked={builtin.includes(category)}
            onChange={() => toggleBuiltin(category)}
            className="categoryChip categoryChip--builtin"
          >
            {text.builtin[category]}
          </ChoiceChip>
        ))}
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
        {canCreate && draft === null && <AddChip onClick={() => setDraft('')}>+ {text.add}</AddChip>}
      </div>
      {draft !== null && (
        <div className="inlineForm">
          <Input
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
