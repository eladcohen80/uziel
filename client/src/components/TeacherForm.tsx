import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Teacher } from '../types/Teacher'
import { createTeacher, updateTeacher, getTeacherById } from '../services/teacherService'
import { CLASSES, POSITIONS, classLabel } from '../utils/grades'
import { getStoredUser } from '../services/authService'

const EMPTY_TEACHER: Teacher = { id: '', name: '', grade: '', position: '' }

export default function TeacherForm(){
    const { id } = useParams()
    const navigate = useNavigate()
    const isAdmin = getStoredUser()?.role === 'admin'
    const [teacher, setTeacher] = useState<Teacher>(EMPTY_TEACHER)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!id) return
        getTeacherById(id)
            .then(loaded => setTeacher(loaded))
            .catch(() => setError('שגיאה בטעינת המורה'))
    }, [id])

    function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = event.target
        setTeacher(prev => ({ ...prev, [name]: value }))
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault()
        setError('')
        // בעל תפקיד נשמר בלי כיתה, ומורה כיתה בלי תפקיד
        const payload: Teacher = teacher.position
            ? { ...teacher, grade: null }
            : { ...teacher, position: null }
        try {
            if (teacher.id) {
                await updateTeacher(payload)
                navigate('/teachers')
            } else {
                await createTeacher(payload)
                setTeacher(EMPTY_TEACHER)
            }
        } catch {
            setError('שגיאה בשמירת המורה')
        }
    }

    return (
        <form className="form" onSubmit={handleSubmit}>
            <label>
                שם
                <input name="name" value={teacher.name} onChange={handleChange} required />
            </label>
            <label>
                תפקיד
                <select name="position" value={teacher.position ?? ''} onChange={handleChange} disabled={!isAdmin}>
                    <option value="">מורה</option>
                    {POSITIONS.map(position => (
                        <option key={position} value={position}>{position}</option>
                    ))}
                </select>
            </label>
            <label>
                כיתה
                <select name="grade" value={teacher.grade ?? ''} onChange={handleChange} required={!teacher.position} disabled={!isAdmin || !!teacher.position}>
                    <option value="" disabled>בחר כיתה</option>
                    {CLASSES.map(className => (
                        <option key={className} value={className}>{classLabel(className)}</option>
                    ))}
                </select>
            </label>
            {error && <p className="form-error">{error}</p>}
            <button type="submit">שמירה</button>
        </form>
    )
}
