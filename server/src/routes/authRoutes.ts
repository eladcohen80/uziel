import { Router } from 'express'
import { register, login, forgotPassword, resetPassword } from '../controllers/authController'
import { refreshToken } from '../controllers/authController'
const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/refresh-token', refreshToken)

export default router
