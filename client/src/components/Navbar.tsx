import { Link, useNavigate } from 'react-router-dom'
import { getStoredUser, logout } from '../services/authService'

export default function Navbar() {
    const navigate = useNavigate()
    const token = localStorage.getItem('token')
    const isAdmin = getStoredUser()?.role === 'admin'

    function handleLogout() {
        logout()
        navigate('/login')
    }

  return (
    <nav className="navbar">
      {token && (
        <>
          <Link to="/">דף הבית</Link>
          <Link to="/teachers">צוות</Link>
          {isAdmin && <Link to="/teacherForm">הוספת מורה</Link>}
          <Link to="/pupiles">תלמידים</Link>
          <Link to="/pupilForm">הוספת תלמיד</Link>
        </>
      )}
      <span className="navbar-auth">
        {token ? (
          <button className="danger" onClick={handleLogout}>התנתקות</button>
        ) : (
          <>
            <Link to="/login">התחברות</Link>
            <Link to="/register">הרשמה</Link>
          </>
        )}
      </span>
    </nav>
  )
}