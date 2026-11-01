import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Pupil } from '../types/Pupil'
import { deletePupil, getPupils } from '../services/pupilService'
import { CLASSES, classLabel, classSortIndex } from '../utils/grades'
import { getStoredUser } from '../services/authService'
import { useTableSort } from '../hooks/useTableSort'
import SortableTh from './SortableTh'

type PupilSortKey = 'name' | 'className' | 'Integration' | 'Diagnosis' | 'Educationalresponse' | 'Emotionalresponse' | 'Otherresponse' | 'Notes'

function comparePupils(a: Pupil, b: Pupil, key: PupilSortKey): number {
    if (key === 'className') {
        return classSortIndex(a.className) - classSortIndex(b.className)
            || a.className.localeCompare(b.className, 'he')
            || a.name.localeCompare(b.name, 'he')
    }
    if (key === 'name') {
        return a.name.localeCompare(b.name, 'he')
    }
    // עמודות תוכן: תאים מלאים למעלה (ממוינים ביניהם), ריקים למטה; מיון שניוני לפי סדר הכיתות
    const aValue = a[key] ?? ''
    const bValue = b[key] ?? ''
    if (!aValue && !bValue) return comparePupils(a, b, 'className')
    if (!aValue) return 1
    if (!bValue) return -1
    return aValue.localeCompare(bValue, 'he') || comparePupils(a, b, 'className')
}

export default function PupilsTable() {
    const navigate = useNavigate()
    const [pupils, setPupils] = useState<Pupil[]>([])
    const [error, setError] = useState('')
    const isAdmin = getStoredUser()?.role === 'admin'
    const [selectedClass, setSelectedClass] = useState('')
    const [search, setSearch] = useState('')
    const [wideTable, setWideTable] = useState(false)
    const [selectedPupil, setSelectedPupil] = useState<Pupil | null>(null)
    const { sortColumn, sortDir, toggleSort } = useTableSort<PupilSortKey>('className')
    const query = search.trim().toLowerCase()
    const visiblePupils = pupils.filter(p =>
        (!selectedClass || p.className === selectedClass) &&
        (!query || [p.name, p.className, p.Integration, p.Diagnosis, p.Educationalresponse, p.Emotionalresponse, p.Otherresponse, p.Notes]
            .some(field => field?.toLowerCase().includes(query)))
    )
    const sortedPupils = [...visiblePupils].sort((a, b) => {
        const cmp = comparePupils(a, b, sortColumn)
        return sortDir === 'asc' ? cmp : -cmp
    })

    useEffect(() => {
        getPupils()
            .then(setPupils)
            .catch(() => setError('שגיאה בטעינת התלמידים'))
    }, [])

    async function handleDelete(pupil: Pupil) {
        if (!window.confirm(`למחוק את ${pupil.name}?`)) return
        try {
            await deletePupil(pupil.id)
            setPupils(prev => prev.filter(p => p.id !== pupil.id))
            setSelectedPupil(null)
        } catch {
            setError('שגיאה במחיקת התלמיד')
        }
    }

    return (
        <>
        {error && <p className="form-error">{error}</p>}
        <div className="filter">
            <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="חיפוש..."
            />
            {isAdmin && (
                <label>
                    כיתה:{' '}
                    <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                        <option value="">כל הכיתות</option>
                        {CLASSES.map(className => (
                            <option key={className} value={className}>{classLabel(className)}</option>
                        ))}
                    </select>
                </label>
            )}
            <button type="button" className="table-toggle" onClick={() => setWideTable(w => !w)}>
                {wideTable ? 'טבלה מצומצמת' : 'טבלה מורחבת'}
            </button>
        </div>
        <div className={`table-wrap compact-wrap${wideTable ? ' hidden' : ''}`}>
        <table>
            <thead>
                <tr>
                    <SortableTh label="שם" column="name" sortColumn={sortColumn} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="כיתה" column="className" sortColumn={sortColumn} sortDir={sortDir} onSort={toggleSort} />
                    <th>פרטים</th>
                </tr>
            </thead>
            <tbody>
                {sortedPupils.map(pupil => (
                    <tr key={pupil.id}>
                        <td>{pupil.name}</td>
                        <td>{classLabel(pupil.className)}</td>
                        <td className="actions">
                            <button onClick={() => setSelectedPupil(pupil)}>פרטים</button>
                        </td>
                    </tr>
                ))}
                {sortedPupils.length === 0 && (
                    <tr><td colSpan={3} className="empty">אין תלמידים להצגה</td></tr>
                )}
            </tbody>
        </table>
        </div>
        <div className={`table-wrap full-wrap${wideTable ? ' wide' : ''}`}>
        <table>
            <thead>
                <tr>
                    <SortableTh label="שם" column="name" sortColumn={sortColumn} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="כיתה" column="className" sortColumn={sortColumn} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="שילוב/סל אישי" column="Integration" sortColumn={sortColumn} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="יש איבחון? איזה?" column="Diagnosis" sortColumn={sortColumn} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="תמיכה לימודית" column="Educationalresponse" sortColumn={sortColumn} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="תמיכה ריגשית" column="Emotionalresponse" sortColumn={sortColumn} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="מענים נוספים" column="Otherresponse" sortColumn={sortColumn} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="הערות" column="Notes" sortColumn={sortColumn} sortDir={sortDir} onSort={toggleSort} />
                    <th>פעולות</th>
                </tr>
            </thead>
            <tbody>
                {sortedPupils.map(pupil => (
                    <tr key={pupil.id}>
                        <td>{pupil.name}</td>
                        <td>{classLabel(pupil.className)}</td>
                        <td>{pupil.Integration}</td>
                        <td>{pupil.Diagnosis}</td>
                        <td>{pupil.Educationalresponse}</td>
                        <td>{pupil.Emotionalresponse}</td>
                        <td>{pupil.Otherresponse}</td>
                        <td>{pupil.Notes}</td>
                        <td className="actions">
                            <button onClick={() => navigate(`/pupilForm/${pupil.id}`)}>עריכה</button>
                            <button className="danger" onClick={() => handleDelete(pupil)}>מחיקה</button>
                        </td>
                    </tr>
                ))}
                {sortedPupils.length === 0 && (
                    <tr><td colSpan={9} className="empty">אין תלמידים להצגה</td></tr>
                )}
            </tbody>
        </table>
        </div>
        {selectedPupil && (
        <div className="modal-overlay" onClick={() => setSelectedPupil(null)}>
            <div className="pupil-card" onClick={e => e.stopPropagation()}>
                <h2>{selectedPupil.name}</h2>
                <dl>
                    <div><dt>כיתה</dt><dd>{classLabel(selectedPupil.className)}</dd></div>
                    <div><dt>שילוב/סל אישי</dt><dd>{selectedPupil.Integration}</dd></div>
                    <div><dt>יש איבחון? איזה?</dt><dd>{selectedPupil.Diagnosis}</dd></div>
                    <div><dt>תמיכה לימודית</dt><dd>{selectedPupil.Educationalresponse}</dd></div>
                    <div><dt>תמיכה ריגשית</dt><dd>{selectedPupil.Emotionalresponse}</dd></div>
                    <div><dt>מענים נוספים</dt><dd>{selectedPupil.Otherresponse}</dd></div>
                    <div><dt>הערות</dt><dd>{selectedPupil.Notes}</dd></div>
                </dl>
                <div className="pupil-card-actions">
                    <button onClick={() => navigate(`/pupilForm/${selectedPupil.id}`)}>עריכה</button>
                    <button className="danger" onClick={() => handleDelete(selectedPupil)}>מחיקה</button>
                    <button onClick={() => setSelectedPupil(null)}>סגירה</button>
                </div>
            </div>
        </div>
        )}
        </>
    )
}
