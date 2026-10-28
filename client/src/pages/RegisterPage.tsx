import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { register } from '../services/authService'
import { getAvailableTeachers } from '../services/teacherService'
import { classLabel } from '../utils/grades'

type TeacherOption = Awaited<ReturnType<typeof getAvailableTeachers>>[number]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    getAvailableTeachers()
      .then(setTeachers)
      .catch(() => setError('שגיאה בטעינת רשימת המורים'))
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await register(userName, email, password, teacherId)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה')
    }
  }

  return (
    <div className="page">
      <Navbar />
      <h1>הרשמה</h1>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          שם משתמש
          <input value={userName} onChange={e => setUserName(e.target.value)} required />
        </label>
        <label>
          אימייל
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label>
          סיסמה (לפחות 6 תווים)
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />
        </label>
        <label>
          מורה / בעל תפקיד
          <select value={teacherId} onChange={e => setTeacherId(e.target.value)} required>
            <option value="" disabled>בחר את המורה / בעל התפקיד שלך</option>
            {teachers.map(teacher => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} - {teacher.position ?? (teacher.grade ? classLabel(teacher.grade) : '')}
              </option>
            ))}
          </select>
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit">הירשם</button>
        <p>כבר רשום? <Link to="/login">התחברות</Link></p>
      </form>
    </div>
  )
}
