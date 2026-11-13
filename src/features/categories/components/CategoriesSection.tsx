import { useState, type SubmitEventHandler } from 'react'
import { Button } from '../../../components/Button.tsx'
import { IconButton } from '../../../components/IconButton.tsx'
import { PageSection } from '../../../components/PageSection.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useI18n } from '../../../i18n/index.ts'
import { CATEGORY_NAME_MAX_LENGTH, MAX_CATEGORIES, normalizeCategoryName } from '../../../utils/category.ts'
import { useCategories } from '../hooks/useCategories.ts'

type CategoriesSectionProps = {
  calendarId: string
  canManage: boolean
}

export function CategoriesSection({ calendarId, canManage }: CategoriesSectionProps) {
  const { m } = useI18n()
  const text = m.calendars.categories
  const calendarIds = [calendarId]
  const { isAvailable, categories, error: loadError, create, rename, remove } = useCategories(calendarIds)
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null)
  const adding = useAsyncAction(async () => {
    await create(calendarId, normalizeCategoryName(name))
    setName('')
  })
  const renaming = useAsyncAction(async () => {
    if (!editing) return
    await rename(editing.id, normalizeCategoryName(editing.name))
    setEditing(null)
  })
  const removing = useAsyncAction(remove)

  if (!isAvailable || (!canManage && categories.length === 0)) return null

  const submitNew: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    if (normalizeCategoryName(name)) void adding.run()
  }

  const submitRename: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    if (editing && normalizeCategoryName(editing.name)) void renaming.run()
  }

  return (
    <PageSection title={text.title} description={text.description}>
      {categories.length === 0 ? (
        <p className="emptyHint">{text.empty}</p>
      ) : (
        <ul className="itemList">
          {categories.map((category) => (
            <li key={category.id} className="itemRow">
              {editing?.id === category.id ? (
                <form className="inlineForm" onSubmit={submitRename}>
                  <input
                    className="input"
                    name="categoryName"
                    aria-label={text.nameLabel}
                    maxLength={CATEGORY_NAME_MAX_LENGTH}
                    value={editing.name}
                    onChange={(event) => setEditing({ id: category.id, name: event.target.value })}
                    autoFocus
                  />
                  <Button type="submit" isPending={renaming.isPending}>
                    {m.common.save}
                  </Button>
                  <Button variant="secondary" onClick={() => setEditing(null)}>
                    {m.common.cancel}
                  </Button>
                </form>
              ) : (
                <>
                  <span className="itemRowMain">{category.name}</span>
                  {canManage && (
                    <>
                      <Button variant="outline" onClick={() => setEditing({ id: category.id, name: category.name })}>
                        {text.rename}
                      </Button>
                      <IconButton
                        label={text.remove(category.name)}
                        plain
                        disabled={removing.isPending}
                        onClick={() => void removing.run(category.id)}
                      >
                        ×
                      </IconButton>
                    </>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {canManage && categories.length < MAX_CATEGORIES && (
        <form className="inlineForm" onSubmit={submitNew}>
          <input
            className="input"
            name="newCategory"
            aria-label={text.newLabel}
            placeholder={text.newLabel}
            maxLength={CATEGORY_NAME_MAX_LENGTH}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Button type="submit" isPending={adding.isPending}>
            {text.add}
          </Button>
        </form>
      )}
      <ErrorMessage message={loadError ?? adding.error ?? renaming.error ?? removing.error} />
    </PageSection>
  )
}
