import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../services/api'; // ודא שהנתיב תקין אצלך

function AutoLogoutHandler() {
  const navigate = useNavigate();
  
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // זמני בדיקה (שנה ל-12 ו-15 דקות כשאתה מסיים לבדוק)
  const REFRESH_TIME = 0.5 * 60 * 1000; // 30 שניות לטסט / 12 דקות לייצור
  const LOGOUT_TIME = 1 * 60 * 1000;   // 60 שניות לטסט / 15 דקות לייצור

  const handleLogout = (): void => {
    localStorage.removeItem('token'); 
    navigate('/login'); 
    alert('התנתקת מהמערכת עקב חוסר פעילות של 15 דקות.');
  };

  const handleRefreshToken = async (): Promise<void> => {
    try {
      // ברגע שהטיימר של הריענון מופעל, זה אומר שהמשתמש שרד באפליקציה חצי מהזמן (או 12 דקות)
      // אנחנו קוראים לשרת כדי לקבל טוקן רענן לעוד 15 דקות בשרת
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

  // פונקציית האיפוס שרצה בכל פעם שהמשתמש מזיז עכבר, מקליד או לוחץ
  const resetTimers = (): void => {
    // 1. מנקים את השעונים הקודמים לחלוטין
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);

    // 2. קובעים טיימר ריענון: הוא ירוץ רק אם המשתמש לא נגע בכלום במשך חצי מהזמן (או 12 דקות)
    // הערה: בגלל שכל תזוזה מאפסת את השעונים, הריענון יתבצע רק פעם אחת בתוך חלון הזמן הזה
    refreshTimerRef.current = setTimeout(handleRefreshToken, REFRESH_TIME);
    
    // 3. קובעים את שעון הניתוק הסופי (דקה אחת או 15 דקות)
    logoutTimerRef.current = setTimeout(handleLogout, LOGOUT_TIME);
  };

  useEffect(() => {
    // רשימת האירועים שמגדירים פעילות (כולל mousemove)
    const events: string[] = ['mousemove', 'keypress', 'click', 'scroll'];

    // הפעלה ראשונית של הטיימרים בעליית הקומפוננטה
    resetTimers();

    // כל אירוע מפעיל ישירות את ה-resetTimers ומאפס את שעון הדקה קדימה!
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
