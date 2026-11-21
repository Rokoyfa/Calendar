import type { ReactNode } from 'react'
import { useConfirm } from '../hooks/useConfirm.ts'
import { ConfirmModal } from './ConfirmModal.tsx'
import { ItemList } from './ItemList.tsx'
import { LimitedAdd } from './LimitedAdd.tsx'
import { PageSection } from './PageSection.tsx'
import { ErrorMessage } from './StatusMessage.tsx'

type ManagedListTexts = {
  title: string
  description: string
  empty: string
  limitReached: (max: number) => string
  removeTitle: string
  remove: string
  removing: string
  removeMessage: (name: string) => string
}

type ManagedListSectionProps<T extends { id: string; name: string }> = {
  texts: ManagedListTexts
  items: readonly T[]
  max: number
  error: string | null
  onRemove: (item: T) => Promise<void>
  addForm: ReactNode
  children: (item: T, askRemove: () => void) => ReactNode
}

export function ManagedListSection<T extends { id: string; name: string }>({
  texts,
  items,
  max,
  error,
  onRemove,
  addForm,
  children,
}: ManagedListSectionProps<T>) {
  const removal = useConfirm<T>()
  const toRemove = removal.target

  return (
    <PageSection title={texts.title} description={texts.description}>
      <ErrorMessage message={error} />
      <ItemList items={items} empty={texts.empty} className="calendarSettingList">
        {(item) => children(item, () => removal.ask(item))}
      </ItemList>
      <LimitedAdd count={items.length} max={max} limitText={texts.limitReached}>
        {addForm}
      </LimitedAdd>
      {toRemove && (
        <ConfirmModal
          title={texts.removeTitle}
          confirmLabel={texts.remove}
          pendingLabel={texts.removing}
          onConfirm={() => onRemove(toRemove)}
          onClose={removal.close}
        >
          {texts.removeMessage(toRemove.name)}
        </ConfirmModal>
      )}
    </PageSection>
  )
}
