import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../services/api'; // ודא שהנתיב תקין אצלך

function AutoLogoutHandler() {
  const navigate = useNavigate();
  
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRefreshTimeRef = useRef<number>(0);

  // זמני בדיקה מהירה (חצי דקה ודקה)
  const REFRESH_TIME = 25 * 60 * 1000; // 25 דקות
  const LOGOUT_TIME = 30 * 60 * 1000;   // 30 דקות

  const handleLogout = useCallback((): void => {
    localStorage.removeItem('token'); 
    navigate('/login'); 
    alert('התנתקת מהמערכת עקב חוסר פעילות.');
  }, [navigate]);

  const handleRefreshToken = useCallback(async (): Promise<void> => {
    try {
      const response = await authFetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response && response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
      }
    } catch (error) {
      console.error('Failed to auto-refresh token:', error);
    }
  }, []);

  // עטיפת הפונקציה ב-useCallback מונעת ממנה להיווצר מחדש בכל רנדור
  const resetTimers = useCallback((): void => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);

    const now = Date.now();
    if (now - lastRefreshTimeRef.current >= REFRESH_TIME) {
      lastRefreshTimeRef.current = now;
      handleRefreshToken();
    }

    logoutTimerRef.current = setTimeout(handleLogout, LOGOUT_TIME);
  }, [REFRESH_TIME, LOGOUT_TIME, handleRefreshToken, handleLogout]);

  useEffect(() => {
    const events: string[] = ['mousemove', 'keypress', 'click', 'scroll'];

    // הפעלה ראשונית
    resetTimers();

    // מאזינים לאירועים שמפעילים את פונקציית האיפוס היציבה
    events.forEach(event => window.addEventListener(event, resetTimers));

    // ניקוי מלא בעת עזיבה
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      events.forEach(event => window.removeEventListener(event, resetTimers));
    };
  }, [resetTimers]);

  return null;
}

export default AutoLogoutHandler;
