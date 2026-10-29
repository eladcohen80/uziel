import { Route, Routes } from 'react-router-dom'
import Homepage from './pages/Homepage'
import TeachersPage from './pages/TeachersPage'
import TeacherFormPage from './pages/TeacherFormPage'
import PupilsPage from './pages/PupilsPage'
import PupilFormPage from './pages/PupilFormPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'
import AutoLogoutHandler from './components/AutoLogoutHandler'
function App() {
  return (
    <AutoLogoutHandler>
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/" element={<ProtectedRoute><Homepage /></ProtectedRoute>} />
      <Route path="/teachers" element={<ProtectedRoute><TeachersPage /></ProtectedRoute>} />
      <Route path="/teacherForm" element={<ProtectedRoute adminOnly><TeacherFormPage /></ProtectedRoute>} />
      <Route path="/teacherForm/:id" element={<ProtectedRoute><TeacherFormPage /></ProtectedRoute>} />
      <Route path="/pupiles" element={<ProtectedRoute><PupilsPage /></ProtectedRoute>} />
      <Route path="/pupilForm" element={<ProtectedRoute><PupilFormPage /></ProtectedRoute>} />
      <Route path="/pupilForm/:id" element={<ProtectedRoute><PupilFormPage /></ProtectedRoute>} />
      </Routes>
    </AutoLogoutHandler>
  )
}

export default App
