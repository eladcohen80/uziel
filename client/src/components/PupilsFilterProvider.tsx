import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { PupilsFilterContext, PUPILS_FILTER_STORAGE_KEYS } from '../hooks/usePupilsFilter'

// עוטף את עמוד התלמידים ומשתף את מצב הסינון בין הנאבאר לטבלה
export default function PupilsFilterProvider({ children }: { children: ReactNode }) {
    // מאותחל מה-sessionStorage כדי שהסינון יישמר אחרי מעבר לעריכה וחזרה
    const [search, setSearch] = useState(() => sessionStorage.getItem(PUPILS_FILTER_STORAGE_KEYS.search) ?? '')
    const [selectedClass, setSelectedClass] = useState(() => sessionStorage.getItem(PUPILS_FILTER_STORAGE_KEYS.selectedClass) ?? '')

    useEffect(() => {
        sessionStorage.setItem(PUPILS_FILTER_STORAGE_KEYS.search, search)
    }, [search])
    useEffect(() => {
        sessionStorage.setItem(PUPILS_FILTER_STORAGE_KEYS.selectedClass, selectedClass)
    }, [selectedClass])

    const [exportHandler, setExportHandler] = useState<(() => void) | null>(null)
    // setState מפרש פונקציה כ-updater, לכן עוטפים אותה כדי לשמור את ה-handler עצמו
    const registerExport = useCallback((handler: (() => void) | null) => {
        setExportHandler(() => handler)
    }, [])
    return (
        <PupilsFilterContext.Provider value={{ search, setSearch, selectedClass, setSelectedClass, exportHandler, registerExport }}>
            {children}
        </PupilsFilterContext.Provider>
    )
}
