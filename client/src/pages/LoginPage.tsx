import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import PasswordInput from '../components/PasswordInput'
import { login } from '../services/authService'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה')
    }
  }

  return (
    <div className="page">
      <h1>מערכת ניהול מענים - בי"ס עוזיאל</h1>
      <h2>התחברות</h2>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          אימייל
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label>
          סיסמה
          <PasswordInput value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit">התחבר</button>
        <p><Link to="/forgot-password">שכחתי סיסמה</Link></p>
        <p>אין לך חשבון? <Link to="/register">הרשמה</Link></p>
      </form>
    </div>
  )
}
