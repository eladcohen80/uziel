import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import type { Pupil } from '../types/Pupil'
import type { Meeting } from '../types/Meeting'
import { deletePupil, getPupils } from '../services/pupilService'
import { getAllMeetings, deleteMeeting } from '../services/meetingService'
import { classLabel, classSortIndex } from '../utils/grades'
import { useTableSort, type SortDir } from '../hooks/useTableSort'
import { usePupilsFilter } from '../hooks/usePupilsFilter'
import SortableTh from './SortableTh'

type PupilSortKey = 'name' | 'className' | 'Integration' | 'Diagnosis' | 'Educationalresponse' | 'Emotionalresponse' | 'Otherresponse' | 'Notes'

function formatMeetingDate(date: string): string {
    return new Date(date).toLocaleDateString('he-IL')
}

// Postgres עלול להחזיר מערך כמחרוזת {"א","ב"} - מפרסרים לרשימה מופרדת בפסיקים
function participantsText(participants: Meeting['participants']): string {
    if (Array.isArray(participants)) return participants.join(', ')
    return String(participants)
        .replace(/^\{|\}$/g, '')
        .split(',')
        .map(p => p.trim().replace(/^"|"$/g, ''))
        .filter(Boolean)
        .join(', ')
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

// תא תוכן בטבלה: מציג עד 3 שורות; אם התוכן ארוך יותר, כפתור "..." בסוף השורה השלישית
// מרחיב את כל התוכן, ובסוף התוכן המורחב מופיע כפתור צמצום חזרה
function ClampedCell({ text }: { text?: string }) {
    const [expanded, setExpanded] = useState(false)
    const [overflows, setOverflows] = useState(false)
    const cellRef = useRef<HTMLDivElement>(null)
    // במדידה דרך ResizeObserver צריך את המצב העדכני בלי ליצור את הobserver מחדש
    const expandedRef = useRef(false)
    expandedRef.current = expanded

    useEffect(() => {
        setExpanded(false)
        const el = cellRef.current
        if (!el) return
        // בודקים אם התוכן חורג מ-3 השורות המוצגות; במצב מורחב אין מה למדוד
        const check = () => {
            if (expandedRef.current) return
            setOverflows(el.scrollHeight > el.clientHeight + 1)
        }
        check()
        // הטבלה המורחבת מוסתרת/מוצגת וגודל העמודות משתנה - מודדים מחדש בכל שינוי גודל
        const observer = new ResizeObserver(check)
        observer.observe(el)
        return () => observer.disconnect()
    }, [text])

    if (!text?.trim()) return null

    return (
        <div ref={cellRef} className={`clamped-cell${expanded ? ' expanded' : ''}`}>
            {overflows && !expanded && (
                <button type="button" className="clamp-toggle clamp-expand" onClick={() => setExpanded(true)} aria-label="הצג את כל התוכן">...</button>
            )}
            {text}
            {overflows && expanded && (
                <button type="button" className="clamp-toggle clamp-collapse" onClick={() => setExpanded(false)}>צמצום</button>
            )}
        </div>
    )
}

export default function PupilsTable() {
    const navigate = useNavigate()
    const [pupils, setPupils] = useState<Pupil[]>([])
    const [error, setError] = useState('')
    // החיפוש וסינון הכיתה מוצגים בנאבאר ומשותפים לטבלה דרך הקונטקסט
    const filter = usePupilsFilter()
    const search = filter?.search ?? ''
    const selectedClass = filter?.selectedClass ?? ''
    const registerExport = filter?.registerExport
    const [wideTable, setWideTable] = useState(false)
    const [selectedPupil, setSelectedPupil] = useState<Pupil | null>(null)
    const [meetingsByPupil, setMeetingsByPupil] = useState<Record<string, Meeting[]>>({})
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
    const { sortColumn, sortDir, toggleSort } = useTableSort<PupilSortKey>('className')
    const query = search.trim().toLowerCase()
    const visiblePupils = useMemo(() => pupils.filter(p =>
        (!selectedClass || p.className === selectedClass) &&
        (!query || [p.name, p.className, p.Integration, p.Diagnosis, p.Educationalresponse, p.Emotionalresponse, p.Otherresponse, p.Notes]
            .some(field => field?.toLowerCase().includes(query)))
    ), [pupils, selectedClass, query])
    const sortedPupils = useMemo(() => [...visiblePupils].sort((a, b) => comparePupils(a, b, sortColumn, sortDir)), [visiblePupils, sortColumn, sortDir])

    useEffect(() => {
        getPupils()
            .then(setPupils)
            .catch(() => setError('שגיאה בטעינת התלמידים'))
        getAllMeetings()
            .then(meetings => {
                const grouped: Record<string, Meeting[]> = {}
                for (const meeting of meetings) {
                    (grouped[meeting.pupil_id] ??= []).push(meeting)
                }
                // התאריך האחרון למעלה
                for (const list of Object.values(grouped)) {
                    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                }
                setMeetingsByPupil(grouped)
            })
            // שגיאה בטעינת הפגישות לא חוסמת את טבלת התלמידים
            .catch(() => {})
    }, [])

    // מיוצא מה שמוצג כרגע: אותן שורות (סינון/חיפוש/מיון) ואותן עמודות של הטבלה הנראית
    const exportToExcel = useCallback(() => {
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
    }, [sortedPupils, wideTable])

    // כפתור היצוא בנאבאר מפעיל את היצוא דרך הקונטקסט; הרישום מתעדכן כשהנתונים המוצגים משתנים
    useEffect(() => {
        registerExport?.(exportToExcel)
        return () => registerExport?.(null)
    }, [registerExport, exportToExcel])

    async function handleDeleteMeeting(meeting: Meeting) {
        if (!window.confirm(`למחוק את הפגישה מתאריך ${formatMeetingDate(meeting.date)}?`)) return
        try {
            await deleteMeeting(meeting.id)
            setMeetingsByPupil(prev => ({
                ...prev,
                [meeting.pupil_id]: (prev[meeting.pupil_id] ?? []).filter(m => m.id !== meeting.id)
            }))
            setSelectedMeeting(null)
        } catch {
            setError('שגיאה במחיקת הפגישה')
        }
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
        <div className="table-toggle-row">
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
                        <td className="meetings-cell">
                            {(meetingsByPupil[pupil.id] ?? []).map(meeting => (
                                <button key={meeting.id} type="button" className="meeting-date-link" onClick={() => setSelectedMeeting(meeting)}>
                                    {formatMeetingDate(meeting.date)}
                                </button>
                            ))}
                        </td>
                        <td className="actions">
                            <button onClick={() => setSelectedPupil(pupil)}>פרטים</button>
                        </td>
                    </tr>
                ))}
                {sortedPupils.length === 0 && (
                    <tr><td colSpan={4} className="empty">אין תלמידים להצגה</td></tr>
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
                    <th>פגישות</th>
                    <th>פעולות</th>
                </tr>
            </thead>
            <tbody>
                {sortedPupils.map(pupil => (
                    <tr key={pupil.id}>
                        <td>{pupil.name}</td>
                        <td>{classLabel(pupil.className)}</td>
                        <td><ClampedCell text={pupil.Integration} /></td>
                        <td><ClampedCell text={pupil.Diagnosis} /></td>
                        <td><ClampedCell text={pupil.Educationalresponse} /></td>
                        <td><ClampedCell text={pupil.Emotionalresponse} /></td>
                        <td><ClampedCell text={pupil.Otherresponse} /></td>
                        <td><ClampedCell text={pupil.Notes} /></td>
                        <td className="meetings-cell">
                            {(meetingsByPupil[pupil.id] ?? []).map(meeting => (
                                <button key={meeting.id} type="button" className="meeting-date-link" onClick={() => setSelectedMeeting(meeting)}>
                                    {formatMeetingDate(meeting.date)}
                                </button>
                            ))}
                        </td>
                        <td className="actions">
                            <button onClick={() => navigate(`/meetingForm?pupil_id=${pupil.id}`)}>פגישה</button>
                            <button onClick={() => navigate(`/pupilForm/${pupil.id}`)}>עריכה</button>
                            <button className="danger" onClick={() => handleDelete(pupil)}>מחיקה</button>
                        </td>
                    </tr>
                ))}
                {sortedPupils.length === 0 && (
                    <tr><td colSpan={10} className="empty">אין תלמידים להצגה</td></tr>
                )}
            </tbody>
        </table>
        </div>
        {selectedMeeting && (
        <div className="modal-overlay" onClick={() => setSelectedMeeting(null)}>
            <div className="pupil-card" onClick={e => e.stopPropagation()}>
                <h2>פרטי פגישה</h2>
                <dl>
                    <div><dt>תאריך</dt><dd>{formatMeetingDate(selectedMeeting.date)}</dd></div>
                    <div><dt>נושא</dt><dd>{selectedMeeting.subject}</dd></div>
                    <div><dt>משתתפים</dt><dd>{participantsText(selectedMeeting.participants)}</dd></div>
                    <div><dt>סיכום והמלצות</dt><dd>{selectedMeeting.summary_and_recommendations}</dd></div>
                </dl>
                <div className="pupil-card-actions">
                    <button onClick={() => navigate(`/meetingForm/${selectedMeeting.id}`)}>עריכה</button>
                    <button className="danger" onClick={() => handleDeleteMeeting(selectedMeeting)}>מחק פגישה</button>
                    <button onClick={() => setSelectedMeeting(null)}>סגירה</button>
                </div>
            </div>
        </div>
        )}
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
                    <button onClick={() => navigate(`/meetingForm?pupil_id=${selectedPupil.id}`)}>פגישה</button>
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
