import type { HTMLAttributes, ReactNode } from 'react'

type ItemListProps<T> = Omit<HTMLAttributes<HTMLUListElement>, 'children'> & {
  items: readonly T[]
  empty: ReactNode
  children: (item: T, index: number) => ReactNode
}

export function ItemList<T>({ items, empty, children, className = 'itemList', ...props }: ItemListProps<T>) {
  if (items.length === 0) return <p className="emptyHint">{empty}</p>
  return (
    <ul className={className} {...props}>
      {items.map(children)}
    </ul>
  )
}
