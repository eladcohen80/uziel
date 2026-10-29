import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../services/api';

function AutoLogoutHandler(){
  const navigate = useNavigate();
  
  // הגדרת משתני ה-Ref לשני הטיימרים ולמעקב הפעילות
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserActiveRef = useRef<boolean>(false);

  // הזמנים הרשמיים שלך (12 דקות לריענון, 15 דקות להתנתקות)
  const REFRESH_TIME = 0.5 * 60 * 1000; 
  const LOGOUT_TIME = 1 * 60 * 1000;  

  const handleLogout = (): void => {
    localStorage.removeItem('token'); 
    navigate('/login'); 
    alert('התנתקת מהמערכת עקב חוסר פעילות של 15 דקות.');
  };

  // כאן הוא מבקש את הטוקן מחדש!
  const handleRefreshToken = async (): Promise<void> => {
    // אם עברו 12 דקות והמשתמש לא הזיז עכבר/הקליד, הדגל הוא false -> הפונקציה עוצרת ולא מציקה לשרת
    if (!isUserActiveRef.current) {
      return;
    }

    try {
      // אם המשתמש כן הזיז עכבר במהלך ה-12 דקות, נשלחת בקשה לשרת לקבלת טוקן חדש
      const response = await authFetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response && response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token); // שמירת הטוקן החדש שקיבלנו מהשרת
        
        // איפוס דגל הפעילות והפעלה מחדש של הטיימרים ל-15 דקות הבאות
        isUserActiveRef.current = false;
        resetTimers();
      }
    } catch (error) {
      console.error('Failed to auto-refresh token:', error);
    }
  };

  // פונקציית האיפוס שמפעילה מחדש את שני השעונים במקביל
  const resetTimers = (): void => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);

    // 1. שעון הריענון מתעורר בדקה ה-12 ובודק אם צריך לבקש טוקן חדש
    refreshTimerRef.current = setTimeout(handleRefreshToken, REFRESH_TIME);
    
    // 2. שעון ההתנתקות ירוץ עד הדקה ה-15 וינתק אם אף אחד לא איפס אותו
    logoutTimerRef.current = setTimeout(handleLogout, LOGOUT_TIME);
  };

  useEffect(() => {
    // בכל פעם שיש תנועת עכבר, לחיצה או גלילה - אנחנו רק מדליקים את הדגל ל-true!
    // אנחנו לא מאפסים את ה-setTimeout בכל שנייה (מה שגרם ללולאה הקודמת בטסט)
    const recordActivity = (): void => {
      isUserActiveRef.current = true;
    };

    const events: string[] = ['mousemove', 'keypress', 'click', 'scroll'];

    // הפעלה ראשונית של הטיימרים
    resetTimers();

    // האזנה לאירועים
    events.forEach(event => window.addEventListener(event, recordActivity));

    // ניקוי
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      events.forEach(event => window.removeEventListener(event, recordActivity));
    };
  }, []);

  return null;
}

export default AutoLogoutHandler;
