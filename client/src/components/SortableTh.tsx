import type { ReactNode } from 'react'
import type { SortDir } from '../hooks/useTableSort'

type SortableThProps<K extends string> = {
  label: ReactNode
  column: K
  sortColumn: K
  sortDir: SortDir
  onSort: (column: K) => void
}

// כותרת טבלה לחיצה - ממיינת את הטבלה לפי העמודה ומציגה חץ לפי כיוון המיון
export default function SortableTh<K extends string>({ label, column, sortColumn, sortDir, onSort }: SortableThProps<K>) {
  const active = column === sortColumn
  return (
    <th className="sortable" aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}>
      <button type="button" className="th-sort" onClick={() => onSort(column)}>
        {label}
        {active && <span className="sort-arrow" aria-hidden="true">{sortDir === 'asc' ? '▲' : '▼'}</span>}
      </button>
    </th>
  )
}
