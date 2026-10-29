import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../services/api'; // ודא שהנתיב תקין אצלך

function AutoLogoutHandler(){
  const navigate = useNavigate();
  
  // נשמור את הטיימרים בתוך Refs יציבים כדי שלא יתבלבלו ברנדורים
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRefreshTimeRef = useRef<number>(0);

  // זמני הבדיקה שלך (חצי דקה ודקה)
  const REFRESH_TIME = 0.5 * 60 * 1000; // 30 שניות
  const LOGOUT_TIME = 1 * 60 * 1000;   // 60 שניות

  const handleLogout = (): void => {
    localStorage.removeItem('token'); 
    navigate('/login'); 
    alert('התנתקת מהמערכת עקב חוסר פעילות של 15 דקות.');
  };

  const handleRefreshToken = async (): Promise<void> => {
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
  };

  useEffect(() => {
    // פונקציית האיפוס מוגדרת פה בפנים כדי למנוע Closures קפואים
    const resetTimers = (): void => {
      // 1. ניקוי אקטיבי ומיידי של הטיימרים הקודמים
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);

      const now = Date.now();
      // בדיקה חכמה: מבקשים ריענון מהשרת רק אם עבר לפחות זמן ה-REFRESH_TIME מהריענון האחרון
      // זה מונע הצפה של השרת בבקשות בכל מילישנייה של תזוזת עכבר
      if (now - lastRefreshTimeRef.current >= REFRESH_TIME) {
        lastRefreshTimeRef.current = now;
        handleRefreshToken();
      }

      // 2. קביעת טיימר הניתוק הסופי מחדש
      logoutTimerRef.current = setTimeout(handleLogout, LOGOUT_TIME);
    };

    const events: string[] = ['mousemove', 'keypress', 'click', 'scroll'];

    // הפעלה ראשונית
    resetTimers();

    // רישום האירועים
    events.forEach(event => window.addEventListener(event, resetTimers));

    // ניקוי מלא בעת עזיבה
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      events.forEach(event => window.removeEventListener(event, resetTimers));
    };
  }, [navigate]);

  return null;
}

export default AutoLogoutHandler;
