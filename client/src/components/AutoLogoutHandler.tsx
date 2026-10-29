import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// שינוי הגדרת הטיפוס לפונקציה רגילה שמחזירה JSX.Element או null
function AutoLogoutHandler(){
  const navigate = useNavigate();
  
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserActiveRef = useRef<boolean>(false);

  // זמנים לבדיקה (חצי דקה ודקה) - תחזיר ל-25 ו-30 דקות אחרי שתסיים לבדוק
  const REFRESH_TIME = 0.5 * 60 * 1000; 
  const LOGOUT_TIME = 1 * 60 * 1000;   

  const handleLogout = (): void => {
    localStorage.removeItem('token'); 
    navigate('/login'); 
    alert('התנתקת מהמערכת עקב חוסר פעילות של 30 דקות.');
  };

  const handleRefreshToken = async (): Promise<void> => {
    if (!isUserActiveRef.current) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        isUserActiveRef.current = false;
        resetTimers();
      } else {
        handleLogout();
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
    // השארנו זמנית בלי mousemove לצורך הבדיקה הנוחה של הדקה
    const events: string[] = ['keypress', 'click', 'scroll'];

    resetTimers();

    events.forEach(event => window.addEventListener(event, recordActivity));

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      events.forEach(event => window.removeEventListener(event, recordActivity));
    };
  }, []);

  return null; // מחזיר null בצורה תקינה שמתקבלת על ידי TypeScript
}

export default AutoLogoutHandler;
