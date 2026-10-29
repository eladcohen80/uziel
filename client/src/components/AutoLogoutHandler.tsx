import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../services/api'; // ודא שהנתיב תקין אצלך

function AutoLogoutHandler(){
  const navigate = useNavigate();
  
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserActiveRef = useRef<boolean>(false);

  // זמנים מדויקים לבדיקה (חצי דקה ודקה)
  const REFRESH_TIME = 30 * 1000; // 30 שניות
  const LOGOUT_TIME = 60 * 1000;  // 60 שניות (דקה אחת)

  const handleLogout = (): void => {
    localStorage.removeItem('token'); 
    navigate('/login'); 
    alert('התנתקת מהמערכת עקב חוסר פעילות של 30 דקות.');
  };

  const handleRefreshToken = async (): Promise<void> => {
    // אם המשתמש לא היה פעיל, לא מחדשים - ונותנים לטיימר של הדקה (logoutTimerRef) לנתק אותו בסוף
    if (!isUserActiveRef.current) {
      return;
    }

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
        
        // כאן הקסם: המשתמש היה פעיל, הריענון הצליח -> מאפסים את כל הטיימרים מחדש לדקה הבאה!
        isUserActiveRef.current = false;
        resetTimers();
      }
    } catch (error) {
      console.error('Failed to auto-refresh token:', error);
    }
  };

  const resetTimers = (): void => {
    // ניקוי יסודי של הטיימרים הקודמים כדי שלא ירוצו במקביל
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);

    // אתחול מחדש של שני הטיימרים לעתיד
    refreshTimerRef.current = setTimeout(handleRefreshToken, REFRESH_TIME);
    logoutTimerRef.current = setTimeout(handleLogout, LOGOUT_TIME);
  };

  const recordActivity = (): void => {
    isUserActiveRef.current = true;
  };

  useEffect(() => {
    // מאזינים לאירועים (כרגע ללא mousemove לצורך הבדיקה הנוחה)
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
