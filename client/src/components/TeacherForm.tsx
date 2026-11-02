import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Teacher } from '../types/Teacher'
import { createTeacher, updateTeacher, getTeacherById } from '../services/teacherService'
import { CLASSES, classLabel } from '../utils/grades'

const EMPTY_TEACHER: Teacher = { id: '', name: '', grade: '', position: '', role: 'user' }
// ערך מיוחד בשדה התפקיד: מורה כיתה - רק אז נפתחת בחירת כיתה, והתפקיד נשמר כ-null
const CLASS_TEACHER = 'מורה'

// הטופס מוגן ב-adminOnly בראוטר - מגיעים לכאן רק היועצת (admin)
export default function TeacherForm(){
    const { id } = useParams()
    const navigate = useNavigate()
    const [teacher, setTeacher] = useState<Teacher>(EMPTY_TEACHER)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!id) return
        getTeacherById(id)
            // מורה כיתה נשמר עם position=null - מוצג בטופס כ"מורה" כדי לפתוח את בחירת הכיתה
            .then(loaded => setTeacher({ ...loaded, position: loaded.position ?? CLASS_TEACHER }))
            .catch(() => setError('שגיאה בטעינת איש הצוות'))
    }, [id])

    function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = event.target
        setTeacher(prev => ({ ...prev, [name]: value }))
    }

    const isClassTeacher = teacher.position?.trim() === CLASS_TEACHER

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault()
        setError('')
        // מורה כיתה נשמר עם כיתה ובלי תפקיד; בעל תפקיד אחר נשמר בלי כיתה
        const payload: Teacher = isClassTeacher
            ? { ...teacher, position: null }
            : { ...teacher, grade: null }
        try {
            if (teacher.id) {
                await updateTeacher(payload)
                navigate('/teachers')
            } else {
                await createTeacher(payload)
                setTeacher(EMPTY_TEACHER)
            }
        } catch {
            setError('שגיאה בשמירת איש הצוות')
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
                <input name="position" value={teacher.position ?? ''} onChange={handleChange} required list="position-options" placeholder='מורה או תפקיד אחר, למשל: סגן מנהל' />
                <datalist id="position-options">
                    <option value={CLASS_TEACHER} />
                </datalist>
            </label>
            {isClassTeacher && (
                <label>
                    כיתה
                    <select name="grade" value={teacher.grade ?? ''} onChange={handleChange} required>
                        <option value="" disabled>בחר כיתה</option>
                        {CLASSES.map(className => (
                            <option key={className} value={className}>{classLabel(className)}</option>
                        ))}
                    </select>
                </label>
            )}
            <fieldset className="form-radios">
                <legend>הרשאות צפייה</legend>
                <label>
                    <input type="radio" name="role" value="user" checked={teacher.role === 'user'} onChange={handleChange} />
                    צפייה בכיתה שלו בלבד
                </label>
                <label>
                    <input type="radio" name="role" value="superuser" checked={teacher.role === 'superuser'} onChange={handleChange} />
                    צפייה בכל הכיתות
                </label>
                {/* היועצת כבר רשומה - האופציה מוצגת רק בעריכת הרשומה שלה כדי לא לאבד את ההרשאה */}
                {teacher.role === 'admin' && (
                    <label>
                        <input type="radio" name="role" value="admin" checked onChange={handleChange} />
                        יועצת - צפייה בכל הכיתות וניהול אנשי צוות
                    </label>
                )}
            </fieldset>
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
                <button type="submit">שמירה</button>
                <button type="button" onClick={() => navigate('/teachers')}>סגירה</button>
            </div>
        </form>
    )
}
