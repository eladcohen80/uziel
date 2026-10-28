import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Teacher } from '../types/Teacher'
import { deleteTeacher, getTeachers } from '../services/teacherService'
import { getStoredUser } from '../services/authService'
import { classLabel } from '../utils/grades'

export default function TeachersTable() {
    const navigate = useNavigate()
    const isAdmin = getStoredUser()?.role === 'admin'
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [error, setError] = useState('')

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
                    <th>שם</th>
                    <th>כיתה / תפקיד</th>
                    <th>פעולות</th>
                </tr>
            </thead>
            <tbody>
                {teachers.map(teacher => (
                    <tr key={teacher.id}>
                        <td>{teacher.name}</td>
                        <td>{teacher.position ?? (teacher.grade ? classLabel(teacher.grade) : '')}</td>
                        <td className="actions">
                            <button onClick={() => navigate(`/teacherForm/${teacher.id}`)}>עריכה</button>
                            {isAdmin && (
                                <button className="danger" onClick={() => handleDelete(teacher)}>מחיקה</button>
                            )}
                        </td>
                    </tr>
                ))}
                {teachers.length === 0 && (
                    <tr><td colSpan={3} className="empty">אין מורים להצגה</td></tr>
                )}
            </tbody>
        </table>
        </div>
        </>
    )
}
