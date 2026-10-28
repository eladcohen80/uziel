import { logout } from './authService'

// fetch שמצרף את ה-token, ומנתק את המשתמש אם הוא פג או לא תקף
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('token')
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })
  if (response.status === 401) {
    logout()
    window.location.href = '/login'
  }
  return response
}
