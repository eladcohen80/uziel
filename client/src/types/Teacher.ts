export type Teacher = {
  id: string
  // null כשמדובר בבעל תפקיד שאינו משויך לכיתה
  grade: string | null
  // null כשמדובר במורה כיתה
  position: string | null
  name: string
  // admin = היועצת בלבד (ניהול צוות); superuser = צפייה בכל הכיתות ללא ניהול צוות; user = הכיתה שלו בלבד
  role: 'admin' | 'superuser' | 'user'
}