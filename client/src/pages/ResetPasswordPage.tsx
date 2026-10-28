import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import PasswordInput from '../components/PasswordInput'
import { resetPassword } from '../services/authService'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('הסיסמאות אינן תואמות')
      return
    }
    try {
      await resetPassword(token, password)
      navigate('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה')
    }
  }

  return (
    <div className="page">
      <Navbar />
      <h1>איפוס סיסמה</h1>
      {token ? (
        <form className="form" onSubmit={handleSubmit}>
          <label>
            סיסמה חדשה (לפחות 6 תווים)
            <PasswordInput value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />
          </label>
          <label>
            אימות סיסמה
            <PasswordInput value={confirm} onChange={e => setConfirm(e.target.value)} minLength={6} required />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit">עדכון סיסמה</button>
        </form>
      ) : (
        <>
          <p className="form-error">הקישור לא תקין</p>
          <p><Link to="/forgot-password">לבקשת קישור חדש</Link></p>
        </>
      )}
    </div>
  )
}
