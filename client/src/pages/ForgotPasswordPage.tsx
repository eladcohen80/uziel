import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { forgotPassword } from '../services/authService'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      setMessage(await forgotPassword(email))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה')
    }
  }

  return (
    <div className="page">
      <Navbar />
      <h1>איפוס סיסמה</h1>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          אימייל
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        {message && (
          <p className="form-success">
            {message}
            <br />
            אם המייל לא מופיע בתיבת הדואר הנכנס, בדוק גם בתיקיית הספאם.
          </p>
        )}
        {error && <p className="form-error">{error}</p>}
        <button type="submit">שליחת קישור לאיפוס</button>
        <p>נזכרת בסיסמה? <Link to="/login">התחברות</Link></p>
      </form>
    </div>
  )
}
