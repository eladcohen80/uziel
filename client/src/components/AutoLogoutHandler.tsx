import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../services/api';
import { logout } from '../services/authService';
import { API_BASE } from '../services/config';

function AutoLogoutHandler() {
  const navigate = useNavigate();

  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const REFRESH_TIME = 0.5 * 60 * 1000; // 0.5 דקות
  const LOGOUT_TIME = 1 * 60 * 1000;   // 1 דקות

  const handleLogout = useCallback((): void => {
    logout();
    navigate('/login');
    alert('התנתקת מהמערכת עקב חוסר פעילות.');
  }, [navigate]);

  const handleRefreshToken = useCallback(async (): Promise<void> => {
    try {
      const response = await authFetch(`${API_BASE}/api/auth/refresh-token`, {
        method: 'POST'
      });

      if (response && response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
      }
    } catch (error) {
      console.error('Failed to auto-refresh token:', error);
    }
  }, []);

  // רענון הטוקן כל 25 דקות, ללא תלות באירועי פעילות, כדי שהטוקן לא יפוג במהלך עבודה שוטפת
  useEffect(() => {
    handleRefreshToken();
    const refreshInterval = setInterval(handleRefreshToken, REFRESH_TIME);
    return () => clearInterval(refreshInterval);
  }, [handleRefreshToken, REFRESH_TIME]);

  // עטיפת הפונקציה ב-useCallback מונעת ממנה להיווצר מחדש בכל רנדור
  const resetLogoutTimer = useCallback((): void => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    logoutTimerRef.current = setTimeout(handleLogout, LOGOUT_TIME);
  }, [handleLogout, LOGOUT_TIME]);

  useEffect(() => {
    const events: string[] = ['mousemove', 'keypress', 'click', 'scroll'];

    // הפעלה ראשונית
    resetLogoutTimer();

    // מאזינים לאירועים שמפעילים את פונקציית האיפוס היציבה
    events.forEach(event => window.addEventListener(event, resetLogoutTimer));

    // ניקוי מלא בעת עזיבה
    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      events.forEach(event => window.removeEventListener(event, resetLogoutTimer));
    };
  }, [resetLogoutTimer]);

  return null;
}

export default AutoLogoutHandler;
