import { Router } from 'express'
import { createTeacher, updateTeacher, deleteTeacher, getTeachers, getTeacherById, getAvailableTeachers } from '../controllers/teacherController'
import { authMiddleware, isAdmin } from '../middleware/authMiddleware'

const router = Router()

router.get('/available', getAvailableTeachers)

router.use(authMiddleware)
router.post('/', isAdmin, createTeacher)
router.put('/:id', updateTeacher)
router.delete('/:id', isAdmin, deleteTeacher)
router.get('/', getTeachers)
router.get('/:id', getTeacherById)

export default router
