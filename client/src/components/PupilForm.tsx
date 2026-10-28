import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Pupil } from '../types/Pupil'
import { createPupil, getPupilById, updatePupil } from '../services/pupilService'
import { CLASSES, classLabel, isPromotingClass } from '../utils/grades'

const EMPTY_PUPIL: Pupil = {
    id: '',
    name: '',
    className: CLASSES[0],
    Integration: '',
    Diagnosis: '',
    Educationalresponse: '',
    Emotionalresponse: '',
    Otherresponse: '',
    Notes: ''
}

export default function PupilForm(){
    const { id } = useParams()
    const navigate = useNavigate()
    const [pupil, setPupil] = useState<Pupil>(EMPTY_PUPIL)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!id) return
        getPupilById(id)
            .then(setPupil)
            .catch(() => setError('שגיאה בטעינת התלמיד'))
    }, [id])

    function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        const { name, value } = event.target
        setPupil(prev => ({ ...prev, [name]: value }))
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault()
        setError('')
        try {
            if (pupil.id) {
                await updatePupil(pupil)
                navigate('/pupiles')
            } else {
                await createPupil(pupil)
                setPupil(EMPTY_PUPIL)
            }
        } catch {
            setError('שגיאה בשמירת התלמיד')
        }
    }

    return (
        <form className="form form-wide" onSubmit={handleSubmit}>
            <label>
                שם
                <input name="name" value={pupil.name} onChange={handleChange} required />
            </label>
            <label>
                כיתה
                <select name="className" value={pupil.className} onChange={handleChange}>
                    {CLASSES.map(className => (
                        <option key={className} value={className}>{classLabel(className)}</option>
                    ))}
                </select>
            </label>
            {isPromotingClass(pupil.className) && (
                <label>
                    שנת התחלה של כיתה א (למשל 2026)
                    <input name="startYearGrade1" type="number" value={pupil.startYearGrade1 ?? ''} onChange={e => setPupil(prev => ({ ...prev, startYearGrade1: Number(e.target.value) }))} required />
                </label>
            )}
            <label>
                שילוב/סל אישי
                <input name="Integration" value={pupil.Integration ?? ''} onChange={handleChange} />
            </label>
            <label>
                יש איבחון? איזה?
                <input name="Diagnosis" value={pupil.Diagnosis ?? ''} onChange={handleChange} />
            </label>
            <label>
                מענה לימודי
                <input name="Educationalresponse" value={pupil.Educationalresponse ?? ''} onChange={handleChange} />
            </label>
            <label>
                מענה רגשי
                <input name="Emotionalresponse" value={pupil.Emotionalresponse ?? ''} onChange={handleChange} />
            </label>
            <label>
                מענה אחר
                <input name="Otherresponse" value={pupil.Otherresponse ?? ''} onChange={handleChange} />
            </label>
            <label>
                הערות
                <textarea name="Notes" value={pupil.Notes ?? ''} onChange={handleChange} />
            </label>
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
                <button type="submit">שמירה</button>
                <button type="button" onClick={() => navigate('/pupiles')}>סגירה</button>
            </div>
        </form>
    )
}
