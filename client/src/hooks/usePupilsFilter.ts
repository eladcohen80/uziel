import { createContext, useContext } from 'react'

// החיפוש, סינון הכיתה והיצוא לאקסל של טבלת התלמידים מוצגים בנאבאר,
// לכן המצב משותף לנאבאר ולטבלה דרך קונטקסט שעוטף את עמוד התלמידים
export type PupilsFilterContextValue = {
    search: string
    setSearch: (value: string) => void
    selectedClass: string
    setSelectedClass: (value: string) => void
    // הטבלה רושמת את פונקציית היצוא שלה, וכפתור היצוא בנאבאר מפעיל אותה
    exportHandler: (() => void) | null
    registerExport: (handler: (() => void) | null) => void
}

export const PupilsFilterContext = createContext<PupilsFilterContextValue | null>(null)

// מחזיר null מחוץ לעמוד התלמידים - שם הנאבאר לא מציג את פקדי הסינון
export function usePupilsFilter() {
    return useContext(PupilsFilterContext)
}
