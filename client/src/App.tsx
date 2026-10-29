import { Route, Routes, Outlet } from 'react-router-dom'
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
  <Routes>
    {/* עמודים ציבוריים - ללא ניתוק אוטומטי וללא הגנה */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />

    {/* עמודים מוגנים - כולם ייהנו מהניתוק האוטומטי ומהגנת ה-Auth */}
    <Route
      element={
        <ProtectedRoute>
          {/* הוספת ה-Handler כאן מבטיחה שהוא יפעל רק למשתמשים מחוברים, ותחת הראוטר */}
          <AutoLogoutHandler /> 
          <Outlet /> {/* כאן יתרנדרו הילדים של הראוט המוגן */}
        </ProtectedRoute>
      }
    >
      <Route path="/" element={<Homepage />} />
      <Route path="/teachers" element={<TeachersPage />} />
      <Route path="/teacherForm" element={<ProtectedRoute adminOnly><TeacherFormPage /></ProtectedRoute>} />
      <Route path="/teacherForm/:id" element={<ProtectedRoute><TeacherFormPage /></ProtectedRoute>} />
      <Route path="/teacherForm/:id" element={<ProtectedRoute><TeacherFormPage /></ProtectedRoute>} />
      <Route path="/pupiles" element={<ProtectedRoute><PupilsPage /></ProtectedRoute>} />
      <Route path="/pupilForm" element={<ProtectedRoute><PupilFormPage /></ProtectedRoute>} />
      <Route path="/pupilForm/:id" element={<ProtectedRoute><PupilFormPage /></ProtectedRoute>} />
    </Route>
  </Routes>
);

}

export default App
