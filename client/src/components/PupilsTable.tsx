import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Pupil } from '../types/Pupil'
import { deletePupil, getPupils } from '../services/pupilService'
import { CLASSES, classLabel } from '../utils/grades'
import { getStoredUser } from '../services/authService'

export default function PupilsTable() {
    const navigate = useNavigate()
    const [pupils, setPupils] = useState<Pupil[]>([])
    const [error, setError] = useState('')
    const isAdmin = getStoredUser()?.role === 'admin'
    const [selectedClass, setSelectedClass] = useState('')
    const [search, setSearch] = useState('')
    const query = search.trim().toLowerCase()
    const visiblePupils = pupils.filter(p =>
        (!selectedClass || p.className === selectedClass) &&
        (!query || [p.name, p.className, p.Educationalresponse, p.Emotionalresponse, p.Otherresponse, p.Notes]
            .some(field => field?.toLowerCase().includes(query)))
    )

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
        </div>
        <div className="table-wrap">
        <table>
            <thead>
                <tr>
                    <th>שם</th>
                    <th>כיתה</th>
                    <th>מענה לימודי</th>
                    <th>מענה רגשי</th>
                    <th>מענה אחר</th>
                    <th>הערות</th>
                    <th>פעולות</th>
                </tr>
            </thead>
            <tbody>
                {visiblePupils.map(pupil => (
                    <tr key={pupil.id}>
                        <td>{pupil.name}</td>
                        <td>{classLabel(pupil.className)}</td>
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
                {visiblePupils.length === 0 && (
                    <tr><td colSpan={7} className="empty">אין תלמידים להצגה</td></tr>
                )}
            </tbody>
        </table>
        </div>
        </>
    )
}
