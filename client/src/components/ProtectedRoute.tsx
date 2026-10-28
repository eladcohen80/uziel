import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { getStoredUser } from '../services/authService'

type Props = {
  children: ReactNode
  adminOnly?: boolean
}

export default function ProtectedRoute({ children, adminOnly = false }: Props) {
  const user = getStoredUser()
  if (!localStorage.getItem('token') || !user) {
    return <Navigate to="/login" replace />
  }
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
