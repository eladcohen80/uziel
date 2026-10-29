import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function AutoLogoutHandler(): React.JSX.Element | null {
  const navigate = useNavigate();
  const timeoutRef = useRef<number | null>(null);

  // שימוש ב-useCallback מונע מהפונקציה להיווצר מחדש בכל רינדור ולגרום ללולאה אינסופית
  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // הגדרת טיימר ל-60 שניות (דקה אחת)
    timeoutRef.current = window.setTimeout(() => {
      handleLogout();
    }, 60000); 
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token'); // או הדרך שבה אתה מוחק את ה-Session
    navigate('/login');
  };

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];

    // האזנה לאירועים
    events.forEach(event => window.addEventListener(event, resetTimer));
    
    // הפעלה ראשונית של הטיימר כשהמסך עולה
    resetTimer();

    // ניקוי המאזינים והטיימר כשהקומפוננטה יורדת מהמסך
    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimer]);

  return null;
}

export default AutoLogoutHandler;
