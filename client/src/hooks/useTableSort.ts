import { useState } from 'react'

export type SortDir = 'asc' | 'desc'

// מצב מיון משותף לטבלאות: לחיצה על כותרת חדשה ממיינת עולה, לחיצה חוזרת הופכת את הכיוון
export function useTableSort<K extends string>(defaultColumn: K) {
  const [sortColumn, setSortColumn] = useState<K>(defaultColumn)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function toggleSort(column: K) {
    if (column === sortColumn) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDir('asc')
    }
  }

  return { sortColumn, sortDir, toggleSort }
}
