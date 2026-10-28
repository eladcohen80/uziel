// בפרודקשן (Vercel) מצביע לשרת המרוחק; בפיתוח נשאר ריק וה-proxy של Vite מטפל
export const API_BASE: string = import.meta.env.VITE_SERVER_URL ?? ''
