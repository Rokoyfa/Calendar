import { useState, type KeyboardEvent } from 'react'
import { Button } from '../../../components/Button.tsx'
import { FormField } from '../../../components/FormField.tsx'
import { RemoveButton } from '../../../components/RemoveButton.tsx'
import { useI18n } from '../../../i18n/index.ts'
import { classNames } from '../../../utils/classNames.ts'
import type { TaskChecklistInput } from '../types/task.ts'
import { TASK_CHECKLIST_MAX_ITEMS, TASK_TITLE_MAX_LENGTH } from '../utils/task.ts'

type ChecklistFieldProps = {
  items: readonly TaskChecklistInput[]
  isEditable: boolean
  canToggle: boolean
  onChange: (items: TaskChecklistInput[]) => void
  onToggle?: (index: number, done: boolean) => void
}

export function ChecklistField({ items, isEditable, canToggle, onChange, onToggle }: ChecklistFieldProps) {
  const { m } = useI18n()
  const text = m.tasks
  const [draft, setDraft] = useState('')
  const isFull = items.length >= TASK_CHECKLIST_MAX_ITEMS
  const doneCount = items.filter((item) => item.done).length

  if (!isEditable && items.length === 0) return null

  const add = () => {
    const title = draft.trim()
    if (!title || isFull) return
    onChange([...items, { title, done: false }])
    setDraft('')
  }

  const handleKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    add()
  }

  const change = (index: number, changes: Partial<TaskChecklistInput>) =>
    onChange(items.map((item, position) => (position === index ? { ...item, ...changes } : item)))

  const toggle = (index: number, done: boolean) => {
    if (isEditable) change(index, { done })
    else onToggle?.(index, done)
  }

  return (
    <FormField as="fieldset" label={text.checklist}>
      {items.length > 0 && (
        <>
          <p className="checklistProgress">
            <progress max={items.length} value={doneCount} aria-hidden="true" />
            <span>{text.checklistProgress(doneCount, items.length)}</span>
          </p>
          <ul className="checklist">
            {items.map((item, index) => (
              <li key={item.id ?? `new-${index}`} className={classNames('checklistItem', item.done && 'isDone')}>
                <input
                  type="checkbox"
                  checked={item.done}
                  disabled={!canToggle}
                  aria-label={text.checklistToggle(item.title || text.checklistItem(index + 1))}
                  onChange={(event) => toggle(index, event.target.checked)}
                />
                {isEditable ? (
                  <input
                    className="input"
                    name={`checklist-${index}`}
                    aria-label={text.checklistItem(index + 1)}
                    maxLength={TASK_TITLE_MAX_LENGTH}
                    value={item.title}
                    onChange={(event) => change(index, { title: event.target.value })}
                  />
                ) : (
                  <span className="checklistTitle">{item.title}</span>
                )}
                {isEditable && (
                  <RemoveButton
                    label={text.checklistRemove(item.title || text.checklistItem(index + 1))}
                    onClick={() => onChange(items.filter((_, position) => position !== index))}
                  />
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      {isEditable &&
        (isFull ? (
          <p className="formHint">{text.checklistFull(TASK_CHECKLIST_MAX_ITEMS)}</p>
        ) : (
          <div className="inlineForm">
            <input
              className="input"
              name="newChecklistItem"
              aria-label={text.checklistAdd}
              placeholder={text.checklistPlaceholder}
              maxLength={TASK_TITLE_MAX_LENGTH}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKey}
            />
            <Button variant="outline" disabled={!draft.trim()} onClick={add}>
              {text.checklistAdd}
            </Button>
          </div>
        ))}
    </FormField>
  )
}
