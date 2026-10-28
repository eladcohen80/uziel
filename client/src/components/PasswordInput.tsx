import { useState } from 'react'

// שדה סיסמה עם עין: הסיסמה גלויה רק כל עוד העין לחוצה
export default function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false)
  const hide = () => setVisible(false)

  return (
    <span className="password-wrap">
      <input type={visible ? 'text' : 'password'} {...props} />
      <button
        type="button"
        className="eye-toggle"
        aria-label="הצגת סיסמה"
        onPointerDown={e => { e.preventDefault(); setVisible(true) }}
        onPointerUp={hide}
        onPointerLeave={hide}
        onPointerCancel={hide}
        onBlur={hide}
        onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') setVisible(true) }}
        onKeyUp={hide}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </span>
  )
}
