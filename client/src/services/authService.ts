const API_URL = '/api/auth'

export type AuthUser = {
  user_id: number
  user_name: string
  email: string
  role: string
}

type AuthResponse = { token: string; user: AuthUser }

async function post(path: string, body: object): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'שגיאה בשרת')
  }
  return data
}

function saveSession({ token, user }: AuthResponse) {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export async function login(email: string, password: string) {
  saveSession(await post('login', { email, password }))
}

export async function register(user_name: string, email: string, password: string, teacher_id: string) {
  saveSession(await post('register', { user_name, email, password, teacher_id }))
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}
