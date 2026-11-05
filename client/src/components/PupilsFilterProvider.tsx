import { useCallback, useState, type ReactNode } from 'react'
import { PupilsFilterContext } from '../hooks/usePupilsFilter'

// עוטף את עמוד התלמידים ומשתף את מצב הסינון בין הנאבאר לטבלה
export default function PupilsFilterProvider({ children }: { children: ReactNode }) {
    const [search, setSearch] = useState('')
    const [selectedClass, setSelectedClass] = useState('')
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
