import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const AutoLogoutHandler: React.FC = () => {
  const navigate = useNavigate();
  
  // טיימרים לניהול התנתקות וריענון
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // משתנה שעוקב האם המשתמש ביצע פעילות כלשהי מאז הריענון האחרון
  const isUserActiveRef = useRef<boolean>(false);

  // זמנים במילישניות
  const REFRESH_TIME = 0.5 * 60 * 1000; // בקשת טוקן חדש אחרי חצי דקה של פעילות
  const LOGOUT_TIME = 1 * 60 * 1000;  // התנתקות מוחלטת אחרי דקה של חוסר פעילות

  const handleLogout = (): void => {
    localStorage.removeItem('token'); 
    navigate('/login'); 
    alert('התנתקת מהמערכת עקב חוסר פעילות של דקה.');
  };

  const handleRefreshToken = async (): Promise<void> => {
    // אם המשתמש לא היה פעיל בכלל ב-25 דקות האחרונות, אין טעם לחדש - ניתן לו להתנתק בטיימר של ה-30 דקות
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
        // שמירת הטוקן החדש שקיבלנו מהשרת (בתוקף לעוד 30 דקות)
        localStorage.setItem('token', data.token);
        
        // איפוס חיווי הפעילות והתחלת הסבב הבא
        isUserActiveRef.current = false;
        resetTimers();
      } else {
        // אם השרת החזיר שגיאה (למשל הטוקן כבר נפסל), ננתק את המשתמש
        handleLogout();
      }
    } catch (error) {
      console.error('Failed to auto-refresh token:', error);
    }
  };

  const resetTimers = (): void => {
    // ניקוי טיימרים קודמים
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);

    // 1. טיימר ריענון: מנסה לחדש את הטוקן 5 דקות לפני שהוא פג
    refreshTimerRef.current = setTimeout(handleRefreshToken, REFRESH_TIME);

    // 2. טיימר התנתקות: אם המשתמש נטש את המחשב לחלוטין, הוא ינותק בדיוק ב-30 דקות
    logoutTimerRef.current = setTimeout(handleLogout, LOGOUT_TIME);
  };

  // פונקציה שמופעלת בכל תזוזה/הקלדה של המשתמש
  const recordActivity = (): void => {
    isUserActiveRef.current = true;
  };

  useEffect(() => {
    const events: string[] = ['mousemove', 'keypress', 'scroll', 'click'];

    // אתחול ראשוני של הטיימרים בכניסה לאפליקציה
    resetTimers();

    // רישום אירועי האזנה לפעילות משתמש
    events.forEach(event => window.addEventListener(event, recordActivity));

    // ניקוי (Cleanup) בעת יציאה מהקומפוננטה
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      events.forEach(event => window.removeEventListener(event, recordActivity));
    };
  }, []);

  return null; 
};

export default AutoLogoutHandler;
