import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Teacher } from '../types/Teacher'
import { deleteTeacher, getTeachers } from '../services/teacherService'
import { getStoredUser } from '../services/authService'
import { CLASSES, classLabel, classSortIndex } from '../utils/grades'
import { useTableSort } from '../hooks/useTableSort'
import SortableTh from './SortableTh'

type TeacherSortKey = 'name' | 'class'

// בעלי תפקיד שאינם משויכים לכיתה מופיעים אחרי כל הכיתות
function teacherClassIndex(teacher: Teacher): number {
    return teacher.grade ? classSortIndex(teacher.grade) : CLASSES.length
}

function teacherClassLabel(teacher: Teacher): string {
    return teacher.position ?? (teacher.grade ? classLabel(teacher.grade) : '')
}

function compareTeachers(a: Teacher, b: Teacher, key: TeacherSortKey): number {
    if (key === 'class') {
        return teacherClassIndex(a) - teacherClassIndex(b)
            || teacherClassLabel(a).localeCompare(teacherClassLabel(b), 'he')
            || a.name.localeCompare(b.name, 'he')
    }
    return a.name.localeCompare(b.name, 'he')
}

export default function TeachersTable() {
    const navigate = useNavigate()
    const isAdmin = getStoredUser()?.role === 'admin'
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [error, setError] = useState('')
    const { sortColumn, sortDir, toggleSort } = useTableSort<TeacherSortKey>('class')
    const sortedTeachers = [...teachers].sort((a, b) => {
        const cmp = compareTeachers(a, b, sortColumn)
        return sortDir === 'asc' ? cmp : -cmp
    })

    useEffect(() => {
        getTeachers()
            .then(setTeachers)
            .catch(() => setError('שגיאה בטעינת המורים'))
    }, [])

    async function handleDelete(teacher: Teacher) {
        if (!window.confirm(`למחוק את ${teacher.name}?`)) return
        try {
            await deleteTeacher(teacher.id)
            setTeachers(prev => prev.filter(t => t.id !== teacher.id))
        } catch {
            setError('שגיאה במחיקת המורה')
        }
    }

    return (
        <>
        {error && <p className="form-error">{error}</p>}
        <div className="table-wrap">
        <table>
            <thead>
                <tr>
                    <SortableTh label="שם" column="name" sortColumn={sortColumn} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="כיתה / תפקיד" column="class" sortColumn={sortColumn} sortDir={sortDir} onSort={toggleSort} />
                    <th>פעולות</th>
                </tr>
            </thead>
            <tbody>
                {sortedTeachers.map(teacher => (
                    <tr key={teacher.id}>
                        <td>{teacher.name}</td>
                        <td>{teacherClassLabel(teacher)}</td>
                        <td className="actions">
                            <button onClick={() => navigate(`/teacherForm/${teacher.id}`)}>עריכה</button>
                            {isAdmin && (
                                <button className="danger" onClick={() => handleDelete(teacher)}>מחיקה</button>
                            )}
                        </td>
                    </tr>
                ))}
                {sortedTeachers.length === 0 && (
                    <tr><td colSpan={3} className="empty">אין מורים להצגה</td></tr>
                )}
            </tbody>
        </table>
        </div>
        </>
    )
}
