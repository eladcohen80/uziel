export type User = {
    user_id: number
    user_name: string
    email: string
    password: string
    // admin = היועצת בלבד (ניהול צוות); superuser = בעל תפקיד שרואה את כל הכיתות ללא ניהול צוות
    role: 'user' | 'superuser' | 'admin'
  }