import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { getStoredUser, logout } from '../services/authService'
import { usePupilsFilter } from '../hooks/usePupilsFilter'
import { CLASSES, classLabel } from '../utils/grades'
import excelIcon from '../assets/excel-icon.png'

function ExcelIcon() {
    return <img src={excelIcon} width="22" height="22" aria-hidden="true" alt="" />
}

export default function Navbar() {
    const navigate = useNavigate()
    const token = localStorage.getItem('token')
    const isAdmin = getStoredUser()?.role === 'admin'
    // admin ו-superuser רואים את כל הכיתות ויכולים לסנן לפי כיתה
    const seesAllClasses = ['admin', 'superuser'].includes(getStoredUser()?.role ?? '')
    const [open, setOpen] = useState(false)
    const close = () => setOpen(false)
    // פקדי הסינון של טבלת התלמידים - מוצגים רק בעמוד התלמידים, שעטוף ב-PupilsFilterProvider
    const pupilsFilter = usePupilsFilter()

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
      {/* במובייל תיבת החיפוש מוצגת בשורת ההמבורגר; בדסקטופ היא חלק משורת הסינון */}
      {pupilsFilter && (
        <input
          type="search"
          className="navbar-search"
          value={pupilsFilter.search}
          onChange={e => pupilsFilter.setSearch(e.target.value)}
          placeholder="חיפוש..."
        />
      )}

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
      </div>
      {pupilsFilter && (
        <div className="navbar-filters">
          {seesAllClasses && (
            <label>
              כיתה:{' '}
              <select value={pupilsFilter.selectedClass} onChange={e => pupilsFilter.setSelectedClass(e.target.value)}>
                <option value="">כל הכיתות</option>
                {CLASSES.map(className => (
                  <option key={className} value={className}>{classLabel(className)}</option>
                ))}
              </select>
            </label>
          )}
          <span className="export-excel">
            <span>יצא לאקסל:</span>
            <button type="button" className="export-excel-btn" onClick={() => pupilsFilter.exportHandler?.()} title="יצא לאקסל" aria-label="יצא לאקסל">
              <ExcelIcon />
            </button>
          </span>
        </div>
      )}
      {/* כפתור ההתנתקות מוצג בסוף השורה, בצד השמאלי */}
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
    </nav>
  )
}