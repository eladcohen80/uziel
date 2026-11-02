import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { getStoredUser, logout } from '../services/authService'

export default function Navbar() {
    const navigate = useNavigate()
    const token = localStorage.getItem('token')
    const isAdmin = getStoredUser()?.role === 'admin'
    const [open, setOpen] = useState(false)
    const close = () => setOpen(false)

    function handleLogout() {
        logout()
        navigate('/login')
    }

  return (
    <nav className="navbar">
      <button
        type="button"
        className="hamburger"
        aria-label="תפריט"
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>
      {/* במובייל דף הבית מוצג לצד ההמבורגר ולא בתוך התפריט */}
      {token && <NavLink to="/" className="navbar-home" onClick={close}>דף הבית</NavLink>}
      <div className={`navbar-links${open ? ' open' : ''}`}>
        {token && (
          <>
            <NavLink to="/" className="navbar-home-desktop" onClick={close}>דף הבית</NavLink>
            <NavLink to="/teachers" onClick={close}>צוות</NavLink>
            {isAdmin && <NavLink to="/teacherForm" onClick={close}>הוספת איש צוות</NavLink>}
            <NavLink to="/pupiles" onClick={close}>תלמידים</NavLink>
            <NavLink to="/pupilForm" onClick={close}>הוספת תלמיד</NavLink>
          </>
        )}
        <span className="navbar-auth">
          {token ? (
            <button className="danger" onClick={handleLogout}>התנתקות</button>
          ) : (
            <>
              <NavLink to="/login" onClick={close}>התחברות</NavLink>
              <NavLink to="/register" onClick={close}>הרשמה</NavLink>
            </>
          )}
        </span>
      </div>
    </nav>
  )
}