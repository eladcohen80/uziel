import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// ודא שהנתיב היחסי לקובץ ה-api.ts שלך מדויק
import { authFetch } from '../services/api';


function AutoLogoutHandler(){
  const navigate = useNavigate();
  
  // 1. הגדרת ה-Refs בתוך גוף הפונקציה
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserActiveRef = useRef<boolean>(false);

  // זמנים לבדיקה מהירה (חצי דקה ודקה)
  const REFRESH_TIME = 0.5 * 60 * 1000; 
  const LOGOUT_TIME = 1 * 60 * 1000;   

  const handleLogout = (): void => {
    localStorage.removeItem('token'); 
    navigate('/login'); 
    alert('התנתקת מהמערכת עקב חוסר פעילות של 30 דקות.');
  };

  const handleRefreshToken = async (): Promise<void> => {
    // הבדיקה קוראת כאן בתוך הפונקציה בהצלחה
    if (!isUserActiveRef.current) return;

    try {
      // שימוש ב-authFetch המרכזי שלך שמכיר את ה-Base URL
      const response = await authFetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        
        // איפוס הדגל והפעלת הסבב הבא
        isUserActiveRef.current = false;
        resetTimers();
      }
    } catch (error) {
      console.error('Failed to auto-refresh token:', error);
    }
  };

  const resetTimers = (): void => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);

    refreshTimerRef.current = setTimeout(handleRefreshToken, REFRESH_TIME);
    logoutTimerRef.current = setTimeout(handleLogout, LOGOUT_TIME);
  };

  const recordActivity = (): void => {
    isUserActiveRef.current = true;
  };

  useEffect(() => {
    // מאזינים ללחיצות, גלילות והקלדות (בלי mousemove זמנית לצורך הבדיקה)
    const events: string[] = ['keypress', 'click', 'scroll'];

    resetTimers();

    events.forEach(event => window.addEventListener(event, recordActivity));

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      events.forEach(event => window.removeEventListener(event, recordActivity));
    };
  }, []);

  return null;
}

export default AutoLogoutHandler;
