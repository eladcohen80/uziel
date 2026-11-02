import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import type { Pupil } from '../types/Pupil'
import { deletePupil, getPupils } from '../services/pupilService'
import { CLASSES, classLabel, classSortIndex } from '../utils/grades'
import { getStoredUser } from '../services/authService'
import { useTableSort, type SortDir } from '../hooks/useTableSort'
import SortableTh from './SortableTh'
import excelIcon from '../assets/excel-icon.png'

type PupilSortKey = 'name' | 'className' | 'Integration' | 'Diagnosis' | 'Educationalresponse' | 'Emotionalresponse' | 'Otherresponse' | 'Notes'

function ExcelIcon() {
    return <img src={excelIcon} width="22" height="22" aria-hidden="true" alt="" />
}

function comparePupils(a: Pupil, b: Pupil, key: PupilSortKey, dir: SortDir): number {
    if (key === 'className') {
        const cmp = classSortIndex(a.className) - classSortIndex(b.className)
            || a.className.localeCompare(b.className, 'he')
            || a.name.localeCompare(b.name, 'he')
        return dir === 'asc' ? cmp : -cmp
    }
    if (key === 'name') {
        const cmp = a.name.localeCompare(b.name, 'he')
        return dir === 'asc' ? cmp : -cmp
    }
    // עמודות תוכן: מיון ראשוני - תאים מלאים תמיד למעלה; מיון שניוני - סדר הכיתות (החץ קובע את כיוון סדר הכיתות)
    const aValue = (a[key] ?? '').trim()
    const bValue = (b[key] ?? '').trim()
    if (!aValue !== !bValue) return aValue ? -1 : 1
    return comparePupils(a, b, 'className', dir)
}

export default function PupilsTable() {
    const navigate = useNavigate()
    const [pupils, setPupils] = useState<Pupil[]>([])
    const [error, setError] = useState('')
    // admin ו-superuser רואים את כל הכיתות ויכולים לסנן לפי כיתה
    const seesAllClasses = ['admin', 'superuser'].includes(getStoredUser()?.role ?? '')
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
    const sortedPupils = [...visiblePupils].sort((a, b) => comparePupils(a, b, sortColumn, sortDir))

    useEffect(() => {
        getPupils()
            .then(setPupils)
            .catch(() => setError('שגיאה בטעינת התלמידים'))
    }, [])

    function exportToExcel() {
        // מיוצא מה שמוצג כרגע: אותן שורות (סינון/חיפוש/מיון) ואותן עמודות של הטבלה הנראית
        const compact = window.matchMedia('(max-width: 700px)').matches && !wideTable
        const headers = compact
            ? ['שם', 'כיתה']
            : ['שם', 'כיתה', 'שילוב/סל אישי', 'יש איבחון? איזה?', 'תמיכה לימודית', 'תמיכה ריגשית', 'מענים נוספים', 'הערות']
        const rows = sortedPupils.map(pupil => compact
            ? [pupil.name, classLabel(pupil.className)]
            : [pupil.name, classLabel(pupil.className), pupil.Integration, pupil.Diagnosis, pupil.Educationalresponse, pupil.Emotionalresponse, pupil.Otherresponse, pupil.Notes]
        )
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
        worksheet['!cols'] = headers.map((header, col) => ({
            wch: Math.max(header.length, ...rows.map(row => row[col]?.length ?? 0)) + 2
        }))
        const workbook = XLSX.utils.book_new()
        workbook.Workbook = { Views: [{ RTL: true }] }
        XLSX.utils.book_append_sheet(workbook, worksheet, 'תלמידים')
        XLSX.writeFile(workbook, 'תלמידים.xlsx')
    }

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
            <h1>תלמידים</h1>
            <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="חיפוש..."
            />
            <div className="filter-row2">
                {seesAllClasses && (
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
                <span className="export-excel">
                    <span>יצא לאקסל:</span>
                    <button type="button" className="export-excel-btn" onClick={exportToExcel} title="יצא לאקסל" aria-label="יצא לאקסל">
                        <ExcelIcon />
                    </button>
                </span>
                <button type="button" className="table-toggle" onClick={() => setWideTable(w => !w)}>
                    {wideTable ? 'טבלה מצומצמת' : 'טבלה מורחבת'}
                </button>
            </div>
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
