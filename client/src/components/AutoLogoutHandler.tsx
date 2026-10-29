import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../services/api';
import { logout } from '../services/authService';
import { API_BASE } from '../services/config';

function AutoLogoutHandler() {
  const navigate = useNavigate();

  const lastActivityRef = useRef<number>(0); // מאותחל ב-useEffect בעת הטעינה

  // ערכי בדיקה - להחזיר ל-25 ו-30 דקות לאחר הבדיקה
  const REFRESH_TIME = 12 * 60 * 1000; // 12 דקות
  const LOGOUT_TIME = 15 * 60 * 1000;   // 15 דקות
  const CHECK_INTERVAL = 5 * 1000;     // בדיקת חוסר פעילות כל 5 שניות

  const handleLogout = useCallback((): void => {
    if (!localStorage.getItem('token')) return; // כבר מנותק
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

  // זיהוי חוסר פעילות לפי חותמת הזמן של הפעילות האחרונה, עם בדיקה תקופתית.
  // אמין גם כשהדפדפן מעכב טיימרים בטאב ברקע, בניגוד ל-setTimeout בודד
  useEffect(() => {
    const events: string[] = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    const onActivity = (): void => {
      lastActivityRef.current = Date.now();
    };

    const checkInactivity = (): void => {
      if (Date.now() - lastActivityRef.current >= LOGOUT_TIME) {
        handleLogout();
      }
    };

    // כשחוזרים לטאב אחרי שהיה מוסתר - בודקים מיד אם עבר זמן ההתנתקות
    const onVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') checkInactivity();
    };

    lastActivityRef.current = Date.now();

    events.forEach(event => window.addEventListener(event, onActivity));
    document.addEventListener('visibilitychange', onVisibilityChange);
    const interval = setInterval(checkInactivity, CHECK_INTERVAL);

    return () => {
      events.forEach(event => window.removeEventListener(event, onActivity));
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(interval);
    };
  }, [handleLogout, LOGOUT_TIME, CHECK_INTERVAL]);

  return null;
}

export default AutoLogoutHandler;
